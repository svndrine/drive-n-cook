<?php

namespace docker;

use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountMovement extends Model
{
    protected $fillable = [
        'user_id',
        'transaction_id',
        'movement_type',
        'amount',
        'balance_before',
        'balance_after',
        'description',
        'category',
        'created_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_before' => 'decimal:2',
        'balance_after' => 'decimal:2'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec la transaction
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Relation avec l'utilisateur qui a créé le mouvement (admin)
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeDebits($query)
    {
        return $query->where('movement_type', 'debit');
    }

    public function scopeCredits($query)
    {
        return $query->where('movement_type', 'credit');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    /**
     * Vérifier si c'est un débit
     */
    public function isDebit(): bool
    {
        return $this->movement_type === 'debit';
    }

    /**
     * Vérifier si c'est un crédit
     */
    public function isCredit(): bool
    {
        return $this->movement_type === 'credit';
    }

    /**
     * Calculer la variation du solde
     */
    public function getBalanceChange(): float
    {
        return $this->balance_after - $this->balance_before;
    }

    /**
     * Accessor pour le montant formaté avec signe
     */
    protected function formattedAmount(): Attribute
    {
        return Attribute::make(
            get: function () {
                $sign = $this->movement_type === 'debit' ? '-' : '+';
                return $sign . number_format($this->amount, 2, ',', ' ') . ' €';
            }
        );
    }

    /**
     * Accessor pour le type de mouvement traduit
     */
    protected function typeLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->movement_type === 'debit' ? 'Débit' : 'Crédit'
        );
    }

    /**
     * Accessor pour la catégorie traduite
     */
    protected function categoryLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->category) {
                'franchise_fee' => 'Droit d\'entrée',
                'royalty' => 'Royalties',
                'stock_purchase' => 'Achat stock',
                'maintenance' => 'Maintenance',
                'penalty' => 'Pénalité',
                'credit_adjustment' => 'Ajustement',
                'manual_adjustment' => 'Ajustement manuel',
                'deposit' => 'Dépôt',
                'training' => 'Formation',
                default => 'Autre'
            }
        );
    }

    /**
     * Statiques pour obtenir des statistiques
     */
    public static function getTotalByType(int $userId, string $type, $period = null): float
    {
        $query = self::where('user_id', $userId)
            ->where('movement_type', $type);

        if ($period) {
            $query->where('created_at', '>=', $period);
        }

        return $query->sum('amount');
    }

    public static function getTotalByCategory(int $userId, string $category, $period = null): float
    {
        $query = self::where('user_id', $userId)
            ->where('category', $category);

        if ($period) {
            $query->where('created_at', '>=', $period);
        }

        return $query->sum('amount');
    }

    /**
     * Constantes pour les types de mouvement
     */
    public const TYPE_DEBIT = 'debit';
    public const TYPE_CREDIT = 'credit';

    /**
     * Constantes pour les catégories
     */
    public const CATEGORY_FRANCHISE_FEE = 'franchise_fee';
    public const CATEGORY_ROYALTY = 'royalty';
    public const CATEGORY_STOCK_PURCHASE = 'stock_purchase';
    public const CATEGORY_MAINTENANCE = 'maintenance';
    public const CATEGORY_PENALTY = 'penalty';
    public const CATEGORY_CREDIT_ADJUSTMENT = 'credit_adjustment';
    public const CATEGORY_MANUAL_ADJUSTMENT = 'manual_adjustment';
}
