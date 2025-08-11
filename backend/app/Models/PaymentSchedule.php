<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class PaymentSchedule extends Model
{
    protected $fillable = [
        'user_id',
        'franchise_contract_id',
        'schedule_type',
        'amount',
        'due_date',
        'revenue_period_start',
        'revenue_period_end',
        'calculated_revenue',
        'status',
        'transaction_id',
        'reminder_sent_count',
        'last_reminder_sent_at'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'calculated_revenue' => 'decimal:2',
        'due_date' => 'datetime',
        'revenue_period_start' => 'date',
        'revenue_period_end' => 'date',
        'last_reminder_sent_at' => 'datetime',
        'reminder_sent_count' => 'integer'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le contrat de franchise
     */
    public function franchiseContract(): BelongsTo
    {
        return $this->belongsTo(FranchiseContract::class);
    }

    /**
     * Relation avec la transaction (une fois payé)
     */
    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now());
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeByType($query, $type)
    {
        return $query->where('schedule_type', $type);
    }

    public function scopeByPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('due_date', [$startDate, $endDate]);
    }

    /**
     * Vérifier si l'échéance est en retard
     */
    public function isOverdue(): bool
    {
        return $this->status === 'pending' &&
            $this->due_date &&
            $this->due_date->isPast();
    }

    /**
     * Vérifier si l'échéance est payée
     */
    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }

    /**
     * Calculer le nombre de jours de retard
     */
    public function getDaysOverdue(): int
    {
        if (!$this->isOverdue()) {
            return 0;
        }

        return now()->diffInDays($this->due_date);
    }

    /**
     * Marquer comme payé
     */
    public function markAsPaid(Transaction $transaction): self
    {
        $this->update([
            'status' => 'paid',
            'transaction_id' => $transaction->id
        ]);

        return $this;
    }

    /**
     * Incrémenter le compteur de relances
     */
    public function incrementReminderCount(): self
    {
        $this->increment('reminder_sent_count');
        $this->update(['last_reminder_sent_at' => now()]);

        return $this;
    }

    /**
     * Accessor pour le statut traduit
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->status) {
                'pending' => 'En attente',
                'sent' => 'Envoyé',
                'paid' => 'Payé',
                'overdue' => 'En retard',
                'cancelled' => 'Annulé',
                default => 'Inconnu'
            }
        );
    }

    /**
     * Accessor pour le type d'échéance traduit
     */
    protected function typeLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->schedule_type) {
                'monthly_royalty' => 'Royalties mensuelles',
                'quarterly_royalty' => 'Royalties trimestrielles',
                'annual_fee' => 'Frais annuels',
                default => 'Autre'
            }
        );
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
     * Constantes pour les statuts
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_SENT = 'sent';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Constantes pour les types d'échéances
     */
    public const TYPE_MONTHLY_ROYALTY = 'monthly_royalty';
    public const TYPE_QUARTERLY_ROYALTY = 'quarterly_royalty';
    public const TYPE_ANNUAL_FEE = 'annual_fee';
}
