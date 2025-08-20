<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'transaction_id',
        'user_id',
        'amount_ht',
        'vat_amount',
        'amount_ttc',
        'vat_rate',
        'issue_date',
        'due_date',
        'paid_at',
        'status',
        'pdf_path',
        'sent_at',
        'notes'
    ];

    protected $casts = [
        'amount_ht' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'amount_ttc' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'issue_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec la transaction
     */
    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Vérifier si la facture est en retard
     */
    public function isOverdue()
    {
        return $this->status === 'pending' && $this->due_date < now();
    }

    /**
     * Vérifier si la facture est payée
     */
    public function isPaid()
    {
        return $this->status === 'paid';
    }

    /**
     * Obtenir le nombre de jours de retard
     */
    public function getDaysOverdueAttribute()
    {
        if (!$this->isOverdue()) {
            return 0;
        }

        return now()->diffInDays($this->due_date);
    }

    /**
     * Obtenir le statut formaté
     */
    public function getStatusLabelAttribute()
    {
        $labels = [
            'pending' => 'En attente',
            'paid' => 'Payée',
            'cancelled' => 'Annulée',
            'overdue' => 'En retard'
        ];

        if ($this->isOverdue()) {
            return $labels['overdue'];
        }

        return $labels[$this->status] ?? $this->status;
    }

    /**
     * Obtenir la couleur du statut pour l'affichage
     */
    public function getStatusColorAttribute()
    {
        if ($this->isOverdue()) {
            return 'red';
        }

        $colors = [
            'pending' => 'orange',
            'paid' => 'green',
            'cancelled' => 'gray'
        ];

        return $colors[$this->status] ?? 'gray';
    }

    /**
     * Scopes pour les requêtes courantes
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'pending')
            ->where('due_date', '<', now());
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByYear($query, $year)
    {
        return $query->whereYear('issue_date', $year);
    }

    public function scopeByMonth($query, $month)
    {
        return $query->whereMonth('issue_date', $month);
    }

    /**
     * Calculer le montant total des factures dans une collection
     */
    public static function getTotalAmount($invoices)
    {
        return $invoices->sum('amount_ttc');
    }

    /**
     * Calculer le montant total payé dans une collection
     */
    public static function getPaidAmount($invoices)
    {
        return $invoices->where('status', 'paid')->sum('amount_ttc');
    }

    /**
     * Calculer le montant total en attente dans une collection
     */
    public static function getPendingAmount($invoices)
    {
        return $invoices->where('status', 'pending')->sum('amount_ttc');
    }
}
