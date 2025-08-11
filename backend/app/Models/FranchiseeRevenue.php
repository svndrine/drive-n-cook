<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class FranchiseeRevenue extends Model
{
    protected $fillable = [
        'user_id',
        'period_type',
        'period_year',
        'period_month',
        'period_quarter',
        'declared_revenue',
        'verified_revenue',
        'royalty_rate',
        'calculated_royalty',
        'status',
        'submitted_at',
        'approved_at',
        'approved_by',
        'supporting_documents'
    ];

    protected $casts = [
        'period_year' => 'integer',
        'period_month' => 'integer',
        'period_quarter' => 'integer',
        'declared_revenue' => 'decimal:2',
        'verified_revenue' => 'decimal:2',
        'royalty_rate' => 'decimal:2',
        'calculated_royalty' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'supporting_documents' => 'array'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec l'utilisateur qui a approuvé
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopeByPeriod($query, $year, $month = null, $quarter = null)
    {
        $query->where('period_year', $year);

        if ($month) {
            $query->where('period_month', $month);
        }

        if ($quarter) {
            $query->where('period_quarter', $quarter);
        }

        return $query;
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSubmitted($query)
    {
        return $query->whereIn('status', ['submitted', 'under_review', 'approved']);
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'under_review');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Vérifier si la déclaration est soumise
     */
    public function isSubmitted(): bool
    {
        return !in_array($this->status, ['draft']);
    }

    /**
     * Vérifier si la déclaration est approuvée
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Vérifier si la déclaration est en attente
     */
    public function isPending(): bool
    {
        return $this->status === 'under_review';
    }

    /**
     * Soumettre la déclaration
     */
    public function submit(): self
    {
        $this->update([
            'status' => 'submitted',
            'submitted_at' => now()
        ]);

        return $this;
    }

    /**
     * Approuver la déclaration
     */
    public function approve(User $admin, ?float $verifiedRevenue = null): self
    {
        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $admin->id,
            'verified_revenue' => $verifiedRevenue ?? $this->declared_revenue
        ]);

        return $this;
    }

    /**
     * Marquer comme disputée
     */
    public function dispute(): self
    {
        $this->update(['status' => 'disputed']);
        return $this;
    }

    /**
     * Calculer les royalties basées sur le CA déclaré
     */
    public function calculateRoyalty(?float $revenue = null): float
    {
        $baseRevenue = $revenue ?? $this->declared_revenue;
        return $baseRevenue * ($this->royalty_rate / 100);
    }

    /**
     * Obtenir la période formatée
     */
    public function getFormattedPeriod(): string
    {
        if ($this->period_type === 'monthly') {
            $monthNames = [
                1 => 'Janvier', 2 => 'Février', 3 => 'Mars', 4 => 'Avril',
                5 => 'Mai', 6 => 'Juin', 7 => 'Juillet', 8 => 'Août',
                9 => 'Septembre', 10 => 'Octobre', 11 => 'Novembre', 12 => 'Décembre'
            ];

            return $monthNames[$this->period_month] . ' ' . $this->period_year;
        }

        if ($this->period_type === 'quarterly') {
            return 'T' . $this->period_quarter . ' ' . $this->period_year;
        }

        return $this->period_year;
    }

    /**
     * Accessor pour le statut traduit
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->status) {
                'draft' => 'Brouillon',
                'submitted' => 'Soumis',
                'under_review' => 'En cours de vérification',
                'approved' => 'Approuvé',
                'disputed' => 'Contesté',
                default => 'Inconnu'
            }
        );
    }

    /**
     * Accessor pour le CA déclaré formaté
     */
    protected function formattedDeclaredRevenue(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->declared_revenue, 2, ',', ' ') . ' €'
        );
    }

    /**
     * Accessor pour les royalties calculées formatées
     */
    protected function formattedCalculatedRoyalty(): Attribute
    {
        return Attribute::make(
            get: fn () => number_format($this->calculated_royalty, 2, ',', ' ') . ' €'
        );
    }

    /**
     * Constantes pour les statuts
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_DISPUTED = 'disputed';

    /**
     * Constantes pour les types de période
     */
    public const PERIOD_MONTHLY = 'monthly';
    public const PERIOD_QUARTERLY = 'quarterly';
}
