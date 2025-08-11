<?php

namespace App\Jobs;

use App\Models\Transaction;
use App\Models\FranchiseeAccount;
use App\Services\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\PaymentConfirmationMail;

class ProcessStripeWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $webhookData;
    protected $eventType;

    /**
     * Create a new job instance.
     */
    public function __construct(array $webhookData, string $eventType)
    {
        $this->webhookData = $webhookData;
        $this->eventType = $eventType;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Traitement webhook Stripe', [
                'event_type' => $this->eventType,
                'payment_intent_id' => $this->webhookData['id'] ?? null
            ]);

            switch ($this->eventType) {
                case 'payment_intent.succeeded':
                    $this->handlePaymentSucceeded();
                    break;

                case 'payment_intent.payment_failed':
                    $this->handlePaymentFailed();
                    break;

                case 'payment_intent.canceled':
                    $this->handlePaymentCanceled();
                    break;

                case 'payment_intent.requires_action':
                    $this->handlePaymentRequiresAction();
                    break;

                default:
                    Log::info('Type d\'événement webhook non traité: ' . $this->eventType);
            }

        } catch (\Exception $e) {
            Log::error('Erreur traitement webhook Stripe', [
                'event_type' => $this->eventType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Relancer le job en cas d'erreur temporaire
            throw $e;
        }
    }

    /**
     * Traiter un paiement réussi
     */
    protected function handlePaymentSucceeded(): void
    {
        $paymentIntentId = $this->webhookData['id'];
        $amountReceived = $this->webhookData['amount_received'] / 100; // Stripe utilise les centimes

        // Trouver la transaction correspondante
        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$transaction) {
            Log::warning('Transaction non trouvée pour payment_intent', ['payment_intent_id' => $paymentIntentId]);
            return;
        }

        // Mettre à jour la transaction
        $transaction->update([
            'status' => 'completed',
            'paid_at' => now(),
            'stripe_charge_id' => $this->webhookData['latest_charge'] ?? null,
            'payment_method' => $this->webhookData['payment_method']['type'] ?? 'card',
            'metadata' => json_encode($this->webhookData)
        ]);

        // Mettre à jour le compte franchisé
        $account = FranchiseeAccount::where('user_id', $transaction->user_id)->first();
        if ($account) {
            // Créditer le compte si c'est un remboursement, sinon débiter
            if ($transaction->transaction_type === 'refund') {
                $account->credit($amountReceived, "Remboursement - Transaction #{$transaction->id}");
            } else {
                // Pour les paiements normaux, on débite le compte (le franchisé paie)
                $account->debit($amountReceived, "Paiement validé - Transaction #{$transaction->id}");
            }
        }

        // Envoyer email de confirmation
        try {
            $user = $transaction->user;
            if ($user && $user->email) {
                Mail::to($user->email)->queue(new PaymentConfirmationMail($transaction));
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email confirmation paiement', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }

        // Actions spécifiques selon le type de paiement
        $this->handleSpecificPaymentType($transaction);

        Log::info('Paiement traité avec succès', [
            'transaction_id' => $transaction->id,
            'amount' => $amountReceived,
            'user_id' => $transaction->user_id
        ]);
    }

    /**
     * Traiter un paiement échoué
     */
    protected function handlePaymentFailed(): void
    {
        $paymentIntentId = $this->webhookData['id'];
        $failureReason = $this->webhookData['last_payment_error']['message'] ?? 'Erreur inconnue';

        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$transaction) {
            Log::warning('Transaction non trouvée pour payment_intent failed', ['payment_intent_id' => $paymentIntentId]);
            return;
        }

        // Mettre à jour la transaction
        $transaction->update([
            'status' => 'failed',
            'failure_reason' => $failureReason,
            'metadata' => json_encode($this->webhookData)
        ]);

        // Envoyer notification d'échec (email + peut-être SMS)
        try {
            $user = $transaction->user;
            if ($user && $user->email) {
                // TODO: Créer PaymentFailedMail
                // Mail::to($user->email)->queue(new PaymentFailedMail($transaction, $failureReason));
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi notification échec paiement', [
                'transaction_id' => $transaction->id,
                'error' => $e->getMessage()
            ]);
        }

        Log::warning('Paiement échoué', [
            'transaction_id' => $transaction->id,
            'reason' => $failureReason,
            'user_id' => $transaction->user_id
        ]);
    }

    /**
     * Traiter un paiement annulé
     */
    protected function handlePaymentCanceled(): void
    {
        $paymentIntentId = $this->webhookData['id'];

        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$transaction) {
            return;
        }

        $transaction->update([
            'status' => 'canceled',
            'metadata' => json_encode($this->webhookData)
        ]);

        Log::info('Paiement annulé', [
            'transaction_id' => $transaction->id,
            'user_id' => $transaction->user_id
        ]);
    }

    /**
     * Traiter un paiement nécessitant une action
     */
    protected function handlePaymentRequiresAction(): void
    {
        $paymentIntentId = $this->webhookData['id'];

        $transaction = Transaction::where('stripe_payment_intent_id', $paymentIntentId)->first();

        if (!$transaction) {
            return;
        }

        $transaction->update([
            'status' => 'requires_action',
            'metadata' => json_encode($this->webhookData)
        ]);

        // Envoyer notification que l'action est requise
        Log::info('Paiement nécessite une action', [
            'transaction_id' => $transaction->id,
            'user_id' => $transaction->user_id
        ]);
    }

    /**
     * Actions spécifiques selon le type de paiement
     */
    protected function handleSpecificPaymentType(Transaction $transaction): void
    {
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
        }
    }

    /**
     * Traiter le paiement du droit d'entrée
     */
    protected function handleEntryFeePayment(Transaction $transaction): void
    {
        // Activer le compte franchisé
        $user = $transaction->user;
        if ($user) {
            $user->update([
                'is_active' => true,
                'activated_at' => now()
            ]);

            // Mettre à jour le contrat
            if ($transaction->franchiseContract) {
                $transaction->franchiseContract->update([
                    'status' => 'active',
                    'activated_at' => now()
                ]);
            }
        }

        // Programmer les prochains paiements de royalties (12 mois)
        $paymentService = app(PaymentService::class);
        $paymentService->scheduleMonthlyRoyalties($transaction->user_id);

        Log::info('Franchisé activé après paiement droit d\'entrée', [
            'user_id' => $transaction->user_id,
            'transaction_id' => $transaction->id
        ]);
    }

    /**
     * Traiter le paiement des royalties
     */
    protected function handleRoyaltyPayment(Transaction $transaction): void
    {
        // Marquer la période comme payée
        if ($transaction->metadata) {
            $metadata = json_decode($transaction->metadata, true);
            $period = $metadata['period'] ?? null;

            if ($period) {
                // Mettre à jour dans une table de suivi des royalties si nécessaire
                Log::info('Royalty payée', [
                    'user_id' => $transaction->user_id,
                    'period' => $period,
                    'amount' => $transaction->amount
                ]);
            }
        }
    }

    /**
     * Traiter le paiement d'achat de stock
     */
    protected function handleStockPurchasePayment(Transaction $transaction): void
    {
        // Mettre à jour les stocks ou déclencher la livraison
        Log::info('Achat de stock confirmé', [
            'user_id' => $transaction->user_id,
            'amount' => $transaction->amount
        ]);

        // TODO: Intégration avec le système de gestion des stocks
    }

    /**
     * The job failed to process.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Échec traitement webhook Stripe', [
            'event_type' => $this->eventType,
            'error' => $exception->getMessage(),
            'webhook_data' => $this->webhookData
        ]);
    }
}
