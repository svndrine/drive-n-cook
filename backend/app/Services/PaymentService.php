<?php

namespace App\Services;

use App\Models\FranchiseContract;
use App\Models\FranchiseeAccount;
use App\Models\PaymentSchedule;
use App\Models\PaymentType;
use App\Models\Transaction;
use App\Models\User;
use App\Models\AccountMovement;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class PaymentService
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET'));
    }

    /**
     * Processus complet de validation d'un franchisé
     */
    public function processFranchiseeValidation(int $franchiseeId, int $adminId): array
    {
        return DB::transaction(function () use ($franchiseeId, $adminId) {
            $user = User::findOrFail($franchiseeId);

            if ($user->role !== 'franchisee') {
                throw new Exception("L'utilisateur doit être un franchisé");
            }

            // 1. Créer le contrat de franchise
            $contract = $this->createFranchiseContract($franchiseeId);

            // 2. Créer le compte franchisé
            $account = $this->createFranchiseeAccount($franchiseeId);

            // 3. Créer la transaction pour le droit d'entrée
            $franchiseFeeTransaction = $this->createFranchiseFeePayment($franchiseeId, $contract->id);

            // 4. Programmer les futures royalties
            $this->scheduleFutureRoyalties($franchiseeId, $contract->id);

            Log::info("Franchisé {$franchiseeId} validé avec succès par admin {$adminId}");

            return [
                'contract' => $contract,
                'account' => $account,
                'franchise_fee_transaction' => $franchiseFeeTransaction,
                'payment_url' => $this->generatePaymentUrl($franchiseFeeTransaction->id)
            ];
        });
    }

    /**
     * Créer un contrat de franchise
     */
    private function createFranchiseContract(int $franchiseeId): FranchiseContract
    {
        $contractNumber = FranchiseContract::generateContractNumber($franchiseeId);

        return FranchiseContract::create([
            'user_id' => $franchiseeId,
            'contract_number' => $contractNumber,
            'franchise_fee' => 50000.00,
            'royalty_rate' => 4.00,
            'stock_requirement_rate' => 80.00,
            'start_date' => now(),
            'end_date' => now()->addYears(5), // Contrat 5 ans
            'status' => FranchiseContract::STATUS_ACTIVE
        ]);
    }

    /**
     * Créer le compte financier du franchisé
     */
    private function createFranchiseeAccount(int $franchiseeId): FranchiseeAccount
    {
        return FranchiseeAccount::create([
            'user_id' => $franchiseeId,
            'current_balance' => 0.00,
            'available_credit' => 5000.00, // Crédit initial de 5000€
            'account_status' => FranchiseeAccount::STATUS_ACTIVE,
            'credit_limit' => 10000.00 // Limite de crédit
        ]);
    }

    /**
     * Créer la transaction pour le droit d'entrée
     */
    private function createFranchiseFeePayment(int $franchiseeId, int $contractId): Transaction
    {
        $paymentType = PaymentType::findByCode(PaymentType::FRANCHISE_FEE);
        $reference = Transaction::generateReference(PaymentType::FRANCHISE_FEE, $franchiseeId);

        return Transaction::create([
            'user_id' => $franchiseeId,
            'payment_type_id' => $paymentType->id,
            'transaction_reference' => $reference,
            'amount' => 50000.00,
            'status' => Transaction::STATUS_PENDING,
            'payment_method' => Transaction::METHOD_STRIPE,
            'description' => 'Droit d\'entrée franchise Driv\'n Cook - 50 000€',
            'due_date' => now()->addDays(30), // 30 jours pour payer
            'franchise_contract_id' => $contractId,
            'metadata' => [
                'contract_number' => FranchiseContract::find($contractId)->contract_number,
                'payment_deadline' => now()->addDays(30)->toDateString(),
                'franchise_location' => 'Ile-de-France' // À adapter selon les données
            ]
        ]);
    }

    /**
     * Créer l'intention de paiement Stripe
     */
    public function createStripePaymentIntent(int $transactionId): array
    {
        $transaction = Transaction::with(['user', 'paymentType', 'franchiseContract'])
            ->findOrFail($transactionId);

        if ($transaction->status !== Transaction::STATUS_PENDING) {
            throw new Exception("Cette transaction ne peut pas être payée (statut: {$transaction->status})");
        }

        try {
            $intent = PaymentIntent::create([
                'amount' => intval($transaction->amount * 100), // Centimes
                'currency' => strtolower($transaction->currency),
                'metadata' => [
                    'transaction_id' => $transaction->id,
                    'transaction_reference' => $transaction->transaction_reference,
                    'franchisee_id' => $transaction->user_id,
                    'franchisee_email' => $transaction->user->email,
                    'payment_type' => $transaction->paymentType->code,
                    'contract_number' => $transaction->franchiseContract?->contract_number
                ],
                'description' => $transaction->description,
                'receipt_email' => $transaction->user->email
            ]);

            // Sauvegarder l'ID Stripe
            $transaction->update([
                'stripe_payment_intent_id' => $intent->id,
                'status' => Transaction::STATUS_PROCESSING
            ]);

            Log::info("Payment Intent créé", [
                'transaction_id' => $transactionId,
                'stripe_payment_intent_id' => $intent->id,
                'amount' => $transaction->amount,
                'franchisee_email' => $transaction->user->email
            ]);

            return [
                'client_secret' => $intent->client_secret,
                'transaction' => $transaction,
                'publishable_key' => env('STRIPE_PUBLIC_KEY')
            ];

        } catch (Exception $e) {
            Log::error("Erreur création Payment Intent", [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage(),
                'stripe_error' => $e->getCode()
            ]);

            throw new Exception("Impossible de créer l'intention de paiement: " . $e->getMessage());
        }
    }

    /**
     * Confirmer un paiement réussi via webhook Stripe
     */
    public function confirmPaymentFromWebhook(string $stripePaymentIntentId, array $webhookData): ?Transaction
    {
        return DB::transaction(function () use ($stripePaymentIntentId, $webhookData) {
            $transaction = Transaction::where('stripe_payment_intent_id', $stripePaymentIntentId)
                ->first();

            if (!$transaction) {
                Log::warning("Transaction non trouvée pour Payment Intent: {$stripePaymentIntentId}");
                return null;
            }

            if ($transaction->status === Transaction::STATUS_COMPLETED) {
                Log::info("Transaction {$transaction->id} déjà confirmée");
                return $transaction;
            }

            // Mettre à jour la transaction
            $transaction->update([
                'status' => Transaction::STATUS_COMPLETED,
                'completed_at' => now(),
                'provider_transaction_id' => $stripePaymentIntentId,
                'stripe_payment_method_id' => $webhookData['payment_method'] ?? null,
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'stripe_webhook_data' => $webhookData,
                    'confirmed_at' => now()->toISOString()
                ])
            ]);

            // Traiter les effets du paiement
            $this->processPaymentEffects($transaction);

            Log::info("Paiement confirmé via webhook", [
                'transaction_id' => $transaction->id,
                'amount' => $transaction->amount,
                'payment_type' => $transaction->paymentType->code
            ]);

            return $transaction;
        });
    }

    /**
     * Traiter les effets d'un paiement confirmé
     */
    private function processPaymentEffects(Transaction $transaction): void
    {
        $account = FranchiseeAccount::where('user_id', $transaction->user_id)->first();

        if (!$account) {
            Log::error("Compte franchisé introuvable pour user {$transaction->user_id}");
            return;
        }

        // Enregistrer le mouvement de compte
        $account->debit(
            $transaction->amount,
            "Paiement {$transaction->paymentType->name} - {$transaction->transaction_reference}",
            $transaction
        );

        // Actions spécifiques selon le type de paiement
        switch ($transaction->paymentType->code) {
            case PaymentType::FRANCHISE_FEE:
                $this->processFranchiseFeePayment($transaction);
                break;

            case PaymentType::MONTHLY_ROYALTY:
                $this->processRoyaltyPayment($transaction);
                break;

            case PaymentType::STOCK_PURCHASE:
                $this->processStockPurchasePayment($transaction);
                break;
        }
    }

    /**
     * Traiter le paiement du droit d'entrée
     */
    private function processFranchiseFeePayment(Transaction $transaction): void
    {
        // Le franchisé a payé son droit d'entrée -> il peut commencer à opérer
        $contract = $transaction->franchiseContract;

        if ($contract && $contract->status === FranchiseContract::STATUS_ACTIVE) {
            $contract->update([
                'signed_at' => now(),
                'status' => FranchiseContract::STATUS_ACTIVE
            ]);

            Log::info("Contrat de franchise activé après paiement du droit d'entrée", [
                'contract_id' => $contract->id,
                'franchisee_id' => $transaction->user_id
            ]);
        }

        // Créer les premières échéances de royalties
        $this->activateRoyaltySchedules($transaction->user_id);
    }

    /**
     * Traiter le paiement d'une royalty
     */
    private function processRoyaltyPayment(Transaction $transaction): void
    {
        // Marquer l'échéance comme payée
        $schedule = PaymentSchedule::where('user_id', $transaction->user_id)
            ->where('status', 'pending')
            ->where('amount', $transaction->amount)
            ->first();

        if ($schedule) {
            $schedule->update([
                'status' => 'paid',
                'transaction_id' => $transaction->id
            ]);
        }

        // Mettre à jour le total des royalties payées
        $account = FranchiseeAccount::where('user_id', $transaction->user_id)->first();
        $account->increment('total_royalties_paid', $transaction->amount);
    }

    /**
     * Traiter l'achat de stock
     */
    private function processStockPurchasePayment(Transaction $transaction): void
    {
        // Créditer le compte pour les achats futurs
        $account = FranchiseeAccount::where('user_id', $transaction->user_id)->first();
        $account->credit(
            $transaction->amount,
            "Crédit stock suite au paiement {$transaction->transaction_reference}",
            $transaction
        );

        Log::info("Crédit stock ajouté", [
            'franchisee_id' => $transaction->user_id,
            'amount' => $transaction->amount
        ]);
    }

    /**
     * Programmer les royalties futures
     */
    private function scheduleFutureRoyalties(int $franchiseeId, int $contractId): void
    {
        // Programmer les 12 premiers mois de royalties (montant sera calculé plus tard)
        for ($i = 1; $i <= 12; $i++) {
            PaymentSchedule::create([
                'user_id' => $franchiseeId,
                'franchise_contract_id' => $contractId,
                'schedule_type' => 'monthly_royalty',
                'amount' => 0.00, // Sera calculé selon le CA déclaré
                'due_date' => now()->addMonths($i)->endOfMonth(),
                'revenue_period_start' => now()->addMonths($i-1)->startOfMonth()->toDateString(),
                'revenue_period_end' => now()->addMonths($i-1)->endOfMonth()->toDateString(),
                'status' => 'pending'
            ]);
        }

        Log::info("Échéancier royalties créé pour 12 mois", ['franchisee_id' => $franchiseeId]);
    }

    /**
     * Activer les échéances de royalties (après paiement droit d'entrée)
     */
    private function activateRoyaltySchedules(int $franchiseeId): void
    {
        PaymentSchedule::where('user_id', $franchiseeId)
            ->where('status', 'pending')
            ->where('schedule_type', 'monthly_royalty')
            ->update(['status' => 'sent']);

        Log::info("Échéances de royalties activées", ['franchisee_id' => $franchiseeId]);
    }

    /**
     * Calculer et créer une transaction de royalty mensuelle
     */
    public function calculateMonthlyRoyalty(int $franchiseeId, float $declaredRevenue, string $period): Transaction
    {
        $contract = FranchiseContract::where('user_id', $franchiseeId)
            ->where('status', FranchiseContract::STATUS_ACTIVE)
            ->first();

        if (!$contract) {
            throw new Exception("Aucun contrat actif trouvé pour le franchisé {$franchiseeId}");
        }

        $royaltyAmount = $declaredRevenue * ($contract->royalty_rate / 100);
        $paymentType = PaymentType::findByCode(PaymentType::MONTHLY_ROYALTY);
        $reference = Transaction::generateReference(PaymentType::MONTHLY_ROYALTY, $franchiseeId);

        return Transaction::create([
            'user_id' => $franchiseeId,
            'payment_type_id' => $paymentType->id,
            'transaction_reference' => $reference,
            'amount' => $royaltyAmount,
            'status' => Transaction::STATUS_PENDING,
            'payment_method' => Transaction::METHOD_STRIPE,
            'description' => "Royalties {$contract->royalty_rate}% - Période: {$period} - CA déclaré: " . number_format($declaredRevenue, 2) . "€",
            'due_date' => now()->addDays(15), // 15 jours pour payer
            'franchise_contract_id' => $contract->id,
            'metadata' => [
                'declared_revenue' => $declaredRevenue,
                'royalty_rate' => $contract->royalty_rate,
                'calculation_period' => $period,
                'calculated_at' => now()->toISOString()
            ]
        ]);
    }

    /**
     * Obtenir le dashboard financier d'un franchisé
     */
    public function getFranchiseeDashboard(int $franchiseeId): array
    {
        $account = FranchiseeAccount::where('user_id', $franchiseeId)->first();

        if (!$account) {
            throw new Exception("Compte franchisé non trouvé");
        }

        $pendingTransactions = Transaction::where('user_id', $franchiseeId)
            ->where('status', Transaction::STATUS_PENDING)
            ->with('paymentType')
            ->orderBy('due_date')
            ->get();

        $recentMovements = AccountMovement::where('user_id', $franchiseeId)
            ->with('transaction.paymentType')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $overduePayments = Transaction::where('user_id', $franchiseeId)
            ->where('status', Transaction::STATUS_PENDING)
            ->where('due_date', '<', now())
            ->count();

        $contract = FranchiseContract::where('user_id', $franchiseeId)
            ->where('status', FranchiseContract::STATUS_ACTIVE)
            ->first();

        return [
            'account' => $account,
            'contract' => $contract,
            'pending_transactions' => $pendingTransactions,
            'recent_movements' => $recentMovements,
            'overdue_count' => $overduePayments,
            'total_pending_amount' => $pendingTransactions->sum('amount'),
            'stats' => [
                'total_paid_this_year' => $this->getTotalPaidThisYear($franchiseeId),
                'total_royalties_paid' => $account->total_royalties_paid,
                'available_balance' => $account->getAvailableBalance()
            ]
        ];
    }

    /**
     * Obtenir le total payé cette année
     */
    private function getTotalPaidThisYear(int $franchiseeId): float
    {
        return Transaction::where('user_id', $franchiseeId)
            ->where('status', Transaction::STATUS_COMPLETED)
            ->whereYear('completed_at', now()->year)
            ->sum('amount');
    }

    /**
     * Générer l'URL de paiement pour une transaction
     */
    public function generatePaymentUrl(int $transactionId): string
    {
        // URL vers votre page de paiement frontend
        return url("/payment/{$transactionId}");
    }

    /**
     * Annuler une transaction
     */
    public function cancelTransaction(int $transactionId, int $adminId): Transaction
    {
        $transaction = Transaction::findOrFail($transactionId);

        if (!$transaction->canBeCancelled()) {
            throw new Exception("Cette transaction ne peut pas être annulée (statut: {$transaction->status})");
        }

        $transaction->update([
            'status' => Transaction::STATUS_CANCELLED,
            'metadata' => array_merge($transaction->metadata ?? [], [
                'cancelled_by' => $adminId,
                'cancelled_at' => now()->toISOString()
            ])
        ]);

        Log::info("Transaction annulée", [
            'transaction_id' => $transactionId,
            'cancelled_by' => $adminId
        ]);

        return $transaction;
    }
}
