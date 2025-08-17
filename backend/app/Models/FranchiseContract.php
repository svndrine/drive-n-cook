<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class FranchiseContract extends Model
{
    protected $fillable = [
        'user_id',
        'contract_number',
        'franchise_fee',
        'royalty_rate',
        'stock_requirement_rate',
        'signed_at',
        'start_date',
        'end_date',
        'status',
        'contract_pdf_path',
        'pdf_url',
        'signature_data',
        'truck_model',
        'truck_registration',
        'truck_delivery_date'
    ];

    protected $casts = [
        'franchise_fee' => 'decimal:2',
        'royalty_rate' => 'decimal:2',
        'stock_requirement_rate' => 'decimal:2',
        'signed_at' => 'datetime',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'truck_delivery_date' => 'date',
        'signature_data' => 'array'
    ];

    /**
     * Relation avec l'utilisateur (franchisé)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec les transactions
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Relation avec les échéanciers
     */
    public function paymentSchedules(): HasMany
    {
        return $this->hasMany(PaymentSchedule::class);
    }

    /**
     * Scope pour les contrats actifs
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope pour les contrats en cours (dans la période de validité)
     */
    public function scopeCurrent($query)
    {
        return $query->where('start_date', '<=', now())
            ->where(function($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            });
    }

    /**
     * Vérifier si le contrat est expiré
     */
    public function isExpired(): bool
    {
        return $this->end_date && $this->end_date->isPast();
    }

    /**
     * Vérifier si le contrat est signé
     */
    public function isSigned(): bool
    {
        return !is_null($this->signed_at);
    }

    /**
     * Générer un numéro de contrat unique
     */
    public static function generateContractNumber($franchiseeId): string
    {
        $year = date('Y');
        $month = date('m');
        return "DC-{$year}{$month}-" . str_pad($franchiseeId, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Accessor pour le statut traduit
     */
    protected function statusLabel(): Attribute
    {
        return Attribute::make(
            get: fn () => match($this->status) {
                'draft' => 'Brouillon',
                'sent' => 'Envoyé',
                'signed' => 'Signé',
                'active' => 'Actif',
                'suspended' => 'Suspendu',
                'terminated' => 'Terminé',
                default => 'Inconnu'
            }
        );
    }

    /**
     * Constantes pour les statuts
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_SENT = 'sent';
    public const STATUS_SIGNED = 'signed';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_TERMINATED = 'terminated';
}
