<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Transaction extends Model
{
    protected $fillable = [
        'user_id',
        'payment_type_id',
        'transaction_reference',
        'amount',
        'currency',
        'status',
        'payment_method',
        'stripe_payment_intent_id',
        'stripe_payment_method_id',
        'provider_transaction_id',
        'initiated_at',
        'completed_at',
        'due_date',
        'description',
        'metadata',
        'parent_transaction_id',
        'franchise_contract_id'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'initiated_at' => 'datetime',
        'completed_at' => 'datetime',
        'due_date' => 'datetime',
        'metadata' => 'array'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le type de paiement
     */
    public function paymentType(): BelongsTo
    {
        return $this->belongsTo(PaymentType::class);
    }

    /**
     * Relation avec le contrat de franchise
     */
    public function franchiseContract(): BelongsTo
    {
        return $this->belongsTo(FranchiseContract::class);
    }

    /**
     * Relation avec la transaction parent (pour remboursements)
     */
    public function parentTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'parent_transaction_id');
    }

    /**
     * Relation avec les transactions enfants (remboursements)
     */
    public function childTransactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'parent_transaction_id');
    }

    /**
     * Relation avec les mouvements de compte
     */
    public function accountMovements(): HasMany
    {
        return $this->hasMany(AccountMovement::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now());
    }

    public function scopeByPaymentType($query, $paymentTypeCode)
    {
        return $query->whereHas('paymentType', function($q) use ($paymentTypeCode) {
            $q->where('code', $paymentTypeCode);
        });
    }

    /**
     * Vérifier si la transaction est en retard
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending' &&
            $this->due_date &&
            $this->due_date->isPast();
    }

    /**
     * Vérifier si la transaction est terminée
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Vérifier si la transaction peut être annulée
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    /**
     * Générer une référence unique
     */
    public static function generateReference($paymentTypeCode, $franchiseeId): string
    {
        $prefix = match($paymentTypeCode) {
            PaymentType::FRANCHISE_FEE => 'FF',
            PaymentType::MONTHLY_ROYALTY => 'ROY',
            PaymentType::STOCK_PURCHASE => 'STK',
            PaymentType::TRUCK_MAINTENANCE => 'MNT',
            default => 'TXN'
        };

        $date = date('Ymd');
        $timestamp = time();

        return "{$prefix}-{$date}-{$franchiseeId}-{$timestamp}";
    }

    /**
     * Accessor pour le montant formaté
     */
    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->amount, 2, ',', ' ') . ' €'
        );
    }

    /**
     * Accessor pour le statut traduit
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->status) {
                'pending' => 'En attente',
                'processing' => 'En cours',
                'completed' => 'Terminé',
                'failed' => 'Échoué',
                'refunded' => 'Remboursé',
                'cancelled' => 'Annulé',
                default => 'Inconnu'
            }
        );
    }

    /**
     * Constantes pour les statuts
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_REFUNDED = 'refunded';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Constantes pour les méthodes de paiement
     */
    public const METHOD_STRIPE = 'stripe';
    public const METHOD_BANK_TRANSFER = 'bank_transfer';
    public const METHOD_SEPA = 'sepa';
    public const METHOD_CHECK = 'check';
    public const METHOD_CASH = 'cash';
}
