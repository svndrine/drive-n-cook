<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Models\FranchiseeAccount;
use App\Models\PaymentSchedule;
use App\Services\InvoiceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProcessStripeWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $webhookData;
    protected $invoiceService;

    public function __construct($webhookData)
    {
        $this->webhookData = $webhookData;
        $this->invoiceService = app(InvoiceService::class);
    }

    public function handle()
    {
        try {
            $eventType = $this->webhookData['type'];
            $paymentIntent = $this->webhookData['data']['object'];

            Log::info('Traitement webhook Stripe', [
                'event_type' => $eventType,
                'payment_intent_id' => $paymentIntent['id']
            ]);

            switch ($eventType) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentSucceeded($paymentIntent);
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentFailed($paymentIntent);
                    break;

                case 'payment_intent.canceled':
                    $this->handlePaymentCanceled($paymentIntent);
                    break;

                case 'payment_intent.requires_action':
                    $this->handlePaymentRequiresAction($paymentIntent);
                    break;

                default:
                    Log::info('Type d\'événement webhook non géré', [
                        'event_type' => $eventType
                    ]);
                    break;
            }

        } catch (\Exception $e) {
            Log::error('Erreur lors du traitement du webhook Stripe', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'webhook_data' => $this->webhookData
            ]);

            throw $e;
        }
    }

    /**
     * Traiter un paiement réussi
     */
    private function handlePaymentSucceeded($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent['id'])->first();

        if (!$transaction) {
            Log::warning('Transaction non trouvée pour payment_intent', [
                'payment_intent_id' => $paymentIntent['id']
            ]);
            return;
        }

        Log::info('Paiement réussi', [
            'transaction_id' => $transaction->id,
            'amount' => $paymentIntent['amount'] / 100,
            'transaction_type' => $transaction->transaction_type
        ]);

        // Mettre à jour la transaction
        $transaction->update([
            'status' => 'completed',
            'paid_at' => now(),
            'stripe_charge_id' => $paymentIntent['latest_charge'] ?? null
        ]);

        // 🔥 NOUVEAU : Générer automatiquement la facture
        try {
            $invoice = $this->invoiceService->generateInvoicePdf($transaction);

            // Envoyer la facture par email
            $this->invoiceService->sendInvoiceByEmail($invoice);

            Log::info('Facture générée et envoyée automatiquement', [
                'transaction_id' => $transaction->id,
                'invoice_number' => $invoice->invoice_number,
                'invoice_id' => $invoice->id
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la génération de facture automatique', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
            // Ne pas faire échouer le webhook si la facture échoue
        }

        // Créditer le compte franchisé
        $this->creditFranchiseeAccount($transaction);

        // Actions spécifiques selon le type de transaction
        switch ($transaction->transaction_type) {
            case 'entry_fee':
                $this->handleEntryFeePayment($transaction);
                break;

            case 'monthly_royalty':
                $this->handleRoyaltyPayment($transaction);
                break;

            case 'stock_purchase':
                $this->handleStockPurchasePayment($transaction);
                break;

            case 'penalty':
                $this->handlePenaltyPayment($transaction);
                break;
        }

        // Envoyer email de confirmation (en plus de la facture)
        $this->sendPaymentConfirmationEmail($transaction);
    }

    /**
     * Traiter le paiement du droit d'entrée
     */
    private function handleEntryFeePayment($transaction)
    {
        $user = $transaction->user;

        // Activer le franchisé
        $user->update(['is_active' => true]);

        if ($user->franchisee) {
            $user->franchisee->update(['status' => 'active']);
        }

        // Créer les échéances de royalties mensuelles
        $this->createMonthlyRoyaltySchedules($user);

        Log::info('Franchisé activé après paiement droit d\'entrée', [
            'user_id' => $user->id,
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * Créer les échéances de royalties mensuelles
     */
    private function createMonthlyRoyaltySchedules($user)
    {
        // Créer 12 échéances mensuelles
        for ($i = 1; $i <= 12; $i++) {
            PaymentSchedule::create([
                'user_id' => $user->id,
                'amount' => 0, // Sera calculé selon le CA
                'due_date' => now()->addMonths($i)->endOfMonth(),
                'payment_type' => 'monthly_royalty',
                'status' => 'pending',
                'description' => "Royalties mois " . now()->addMonths($i)->format('m/Y'),
                'auto_calculate' => true // Calcul automatique basé sur le CA
            ]);
        }

        Log::info('Échéances de royalties créées', [
            'user_id' => $user->id,
            'schedules_created' => 12
        ]);
    }

    /**
     * Traiter le paiement des royalties
     */
    private function handleRoyaltyPayment($transaction)
    {
        // Marquer l'échéance comme payée
        $schedule = PaymentSchedule::where('user_id', $transaction->user_id)
            ->where('payment_type', 'monthly_royalty')
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->first();

        if ($schedule) {
            $schedule->update([
                'status' => 'paid',
                'paid_at' => now(),
                'transaction_id' => $transaction->id
            ]);
        }

        Log::info('Royalty payment traité', [
            'transaction_id' => $transaction->id,
            'schedule_id' => $schedule ? $schedule->id : null
        ]);
    }

    /**
     * Traiter le paiement d'achat de stocks
     */
    private function handleStockPurchasePayment($transaction)
    {
        // Ici on pourrait déclencher la préparation de commande
        // ou d'autres actions liées aux stocks

        Log::info('Stock purchase payment traité', [
            'transaction_id' => $transaction->id,
            'order_reference' => $transaction->order_reference
        ]);
    }

    /**
     * Traiter le paiement de pénalité
     */
    private function handlePenaltyPayment($transaction)
    {
        Log::info('Penalty payment traité', [
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * Créditer le compte franchisé
     */
    private function creditFranchiseeAccount($transaction)
    {
        $account = FranchiseeAccount::firstOrCreate([
            'user_id' => $transaction->user_id
        ]);

        $account->credit(
            $transaction->amount,
            "Paiement - {$transaction->description}",
            $transaction
        );

        Log::info('Compte franchisé crédité', [
            'user_id' => $transaction->user_id,
            'amount' => $transaction->amount,
            'new_balance' => $account->fresh()->current_balance
        ]);
    }

    /**
     * Envoyer email de confirmation de paiement
     */
    private function sendPaymentConfirmationEmail($transaction)
    {
        try {
            $user = $transaction->user;

            // Data pour l'email de confirmation (différent de la facture)
            $emailData = [
                'user' => $user,
                'transaction' => $transaction,
                'company_name' => 'Driv\'n Cook'
            ];

            Mail::send('emails.payment-confirmation', $emailData, function ($message) use ($user, $transaction) {
                $message->to($user->email, $user->firstname . ' ' . $user->lastname)
                    ->subject("Confirmation de paiement - Transaction #{$transaction->id}");
            });

            Log::info('Email de confirmation de paiement envoyé', [
                'transaction_id' => $transaction->id,
                'user_email' => $user->email
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'email de confirmation', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Traiter un paiement échoué
     */
    private function handlePaymentFailed($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent['id'])->first();

        if (!$transaction) {
            return;
        }

        $transaction->update([
            'status' => 'failed',
            'failure_reason' => $paymentIntent['last_payment_error']['message'] ?? 'Paiement échoué'
        ]);

        // Notifier l'échec
        $this->sendPaymentFailedEmail($transaction, $paymentIntent['last_payment_error']['message'] ?? 'Erreur inconnue');

        Log::warning('Paiement échoué', [
            'transaction_id' => $transaction->id,
            'error' => $paymentIntent['last_payment_error']['message'] ?? 'Erreur inconnue'
        ]);
    }

    /**
     * Traiter un paiement annulé
     */
    private function handlePaymentCanceled($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent['id'])->first();

        if (!$transaction) {
            return;
        }

        $transaction->update([
            'status' => 'cancelled'
        ]);

        Log::info('Paiement annulé', [
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * Traiter un paiement nécessitant une action
     */
    private function handlePaymentRequiresAction($paymentIntent)
    {
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntent['id'])->first();

        if (!$transaction) {
            return;
        }

        $transaction->update([
            'status' => 'requires_action'
        ]);

        // Notifier que l'action est requise
        $this->sendActionRequiredEmail($transaction);

        Log::info('Paiement nécessite une action', [
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * Envoyer email d'échec de paiement
     */
    private function sendPaymentFailedEmail($transaction, $errorMessage)
    {
        try {
            $user = $transaction->user;

            $emailData = [
                'user' => $user,
                'transaction' => $transaction,
                'error_message' => $errorMessage,
                'retry_url' => url("/franchisee/payments/retry/{$transaction->id}")
            ];

            Mail::send('emails.payment-failed', $emailData, function ($message) use ($user, $transaction) {
                $message->to($user->email, $user->firstname . ' ' . $user->lastname)
                    ->subject("Échec de paiement - Transaction #{$transaction->id}");
            });

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'email d\'échec', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Envoyer email pour action requise
     */
    private function sendActionRequiredEmail($transaction)
    {
        try {
            $user = $transaction->user;

            $emailData = [
                'user' => $user,
                'transaction' => $transaction,
                'action_url' => url("/franchisee/payments/complete/{$transaction->id}")
            ];

            Mail::send('emails.payment-action-required', $emailData, function ($message) use ($user, $transaction) {
                $message->to($user->email, $user->firstname . ' ' . $user->lastname)
                    ->subject("Action requise pour votre paiement - Transaction #{$transaction->id}");
            });

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi de l\'email d\'action requise', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}
