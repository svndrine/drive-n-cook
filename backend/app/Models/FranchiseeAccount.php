<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class FranchiseeAccount extends Model
{
    protected $fillable = [
        'user_id',
        'current_balance',
        'available_credit',
        'total_spent',
        'total_royalties_paid',
        'account_status',
        'credit_limit',
        'last_transaction_at'
    ];

    protected $casts = [
        'current_balance' => 'decimal:2',
        'available_credit' => 'decimal:2',
        'total_spent' => 'decimal:2',
        'total_royalties_paid' => 'decimal:2',
        'credit_limit' => 'decimal:2',
        'last_transaction_at' => 'datetime'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les mouvements de compte
     */
    public function movements(): HasMany
    {
        return $this->hasMany(AccountMovement::class, 'user_id', 'user_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('account_status', 'active');
    }

    public function scopeSuspended($query)
    {
        return $query->where('account_status', 'suspended');
    }

    public function scopeBlocked($query)
    {
        return $query->where('account_status', 'blocked');
    }

    public function scopeWithNegativeBalance($query)
    {
        return $query->where('current_balance', '<', 0);
    }

    /**
     * Vérifier si le compte est actif
     */
    public function isActive(): bool
    {
        return $this->account_status === 'active';
    }

    /**
     * Vérifier si le compte est suspendu
     */
    public function isSuspended(): bool
    {
        return $this->account_status === 'suspended';
    }

    /**
     * Vérifier si le compte est bloqué
     */
    public function isBlocked(): bool
    {
        return $this->account_status === 'blocked';
    }

    /**
     * Vérifier si le solde est négatif
     */
    public function hasNegativeBalance(): bool
    {
        return $this->current_balance < 0;
    }

    /**
     * Vérifier si le crédit disponible est suffisant pour un montant
     */
    public function hasSufficientCredit(float $amount): bool
    {
        return ($this->current_balance + $this->available_credit) >= $amount;
    }

    /**
     * Calculer le solde disponible (solde + crédit)
     */
    public function getAvailableBalance(): float
    {
        return $this->current_balance + $this->available_credit;
    }

    /**
     * Débiter le compte
     */
    public function debit(float $amount, string $description, ?Transaction $transaction = null): AccountMovement
    {
        $balanceBefore = $this->current_balance;
        $newBalance = $balanceBefore - $amount;

        $this->update([
            'current_balance' => $newBalance,
            'total_spent' => $this->total_spent + $amount,
            'last_transaction_at' => now()
        ]);

        return $this->recordMovement(
            'debit',
            $amount,
            $balanceBefore,
            $newBalance,
            $description,
            $transaction
        );
    }

    /**
     * Créditer le compte
     */
    public function credit(float $amount, string $description, ?Transaction $transaction = null): AccountMovement
    {
        $balanceBefore = $this->current_balance;
        $newBalance = $balanceBefore + $amount;

        $this->update([
            'current_balance' => $newBalance,
            'last_transaction_at' => now()
        ]);

        return $this->recordMovement(
            'credit',
            $amount,
            $balanceBefore,
            $newBalance,
            $description,
            $transaction
        );
    }

    /**
     * Enregistrer un mouvement de compte
     */
    private function recordMovement(
        string $type,
        float $amount,
        float $balanceBefore,
        float $balanceAfter,
        string $description,
        ?Transaction $transaction = null
    ): AccountMovement {
        return AccountMovement::create([
            'user_id' => $this->user_id,
            'transaction_id' => $transaction?->id,
            'movement_type' => $type,
            'amount' => $amount,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
            'description' => $description,
            'category' => $this->getCategoryFromTransaction($transaction)
        ]);
    }

    /**
     * Déterminer la catégorie à partir de la transaction
     */
    private function getCategoryFromTransaction(?Transaction $transaction): ?string
    {
        if (!$transaction) {
            return 'manual_adjustment';
        }

        return match($transaction->paymentType->code) {
            PaymentType::FRANCHISE_FEE => 'franchise_fee',
            PaymentType::MONTHLY_ROYALTY => 'royalty',
            PaymentType::STOCK_PURCHASE => 'stock_purchase',
            PaymentType::TRUCK_MAINTENANCE => 'maintenance',
            PaymentType::PENALTY => 'penalty',
            default => 'other'
        };
    }

    /**
     * Accessor pour le solde formaté
     */
    protected function formattedBalance(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->current_balance, 2, ',', ' ') . ' €'
        );
    }

    /**
     * Accessor pour le statut traduit
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->account_status) {
                'active' => 'Actif',
                'suspended' => 'Suspendu',
                'blocked' => 'Bloqué',
                default => 'Inconnu'
            }
        );
    }

    /**
     * Constantes pour les statuts de compte
     */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_BLOCKED = 'blocked';
}
