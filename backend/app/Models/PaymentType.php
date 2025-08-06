<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation avec les transactions
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Scope pour les types actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Récupérer un type de paiement par son code
     */
    public static function findByCode(string $code): ?self
    {
        return self::where('code', $code)->first();
    }

    /**
     * Constantes pour les codes de types de paiement
     */
    public const FRANCHISE_FEE = 'FRANCHISE_FEE';
    public const MONTHLY_ROYALTY = 'MONTHLY_ROYALTY';
    public const STOCK_PURCHASE = 'STOCK_PURCHASE';
    public const TRUCK_MAINTENANCE = 'TRUCK_MAINTENANCE';
    public const CREDIT_ADJUSTMENT = 'CREDIT_ADJUSTMENT';
    public const PENALTY = 'PENALTY';
    public const DEPOSIT = 'DEPOSIT';
    public const TRAINING_FEE = 'TRAINING_FEE';
}
