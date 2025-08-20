<?php
// app/Models/StockAlert.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class StockAlert extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'warehouse_id',
        'product_id',
        'alert_type',
        'severity',
        'current_stock',
        'minimum_stock',
        'maximum_stock',
        'status',
        'resolved_at',
        'dismissed_at',
        'resolved_by',
        'notes',
        'action_taken',
        'days_since_last_alert',
        'notification_sent',
        'last_notification_at'
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'resolved_at' => 'datetime',
        'dismissed_at' => 'datetime',
        'last_notification_at' => 'datetime',
        'notification_sent' => 'boolean',
        'current_stock' => 'integer',
        'minimum_stock' => 'integer',
        'maximum_stock' => 'integer',
        'days_since_last_alert' => 'integer'
    ];

    /**
     * The attributes that should be appended to the model's array form.
     */
    protected $appends = [
        'days_since_created',
        'severity_level',
        'is_critical'
    ];

    // =====================================
    // RELATIONS
    // =====================================

    /**
     * Relation avec l'entrepôt
     */
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    /**
     * Relation avec le produit
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Relation avec l'utilisateur qui a résolu l'alerte
     */
    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    // =====================================
    // SCOPES
    // =====================================

    /**
     * Scope pour les alertes actives
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope pour les alertes critiques
     */
    public function scopeCritical(Builder $query): Builder
    {
        return $query->where('severity', 'critical');
    }

    /**
     * Scope pour les alertes par type
     */
    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('alert_type', $type);
    }

    /**
     * Scope pour les alertes par sévérité
     */
    public function scopeBySeverity(Builder $query, string $severity): Builder
    {
        return $query->where('severity', $severity);
    }

    /**
     * Scope pour les alertes récentes (dernières 24h)
     */
    public function scopeRecent(Builder $query): Builder
    {
        return $query->where('created_at', '>=', now()->subDay());
    }

    /**
     * Scope pour les alertes anciennes (plus de X jours)
     */
    public function scopeOlderThan(Builder $query, int $days): Builder
    {
        return $query->where('created_at', '<=', now()->subDays($days));
    }

    /**
     * Scope pour les alertes nécessitant une notification
     */
    public function scopeNeedingNotification(Builder $query): Builder
    {
        return $query->where('notification_sent', false)
            ->where('status', 'active');
    }

    // =====================================
    // ACCESSORS
    // =====================================

    /**
     * Calculer le nombre de jours depuis la création
     */
    public function getDaysSinceCreatedAttribute(): int
    {
        return $this->created_at->diffInDays(now());
    }

    /**
     * Obtenir le niveau de sévérité numérique
     */
    public function getSeverityLevelAttribute(): int
    {
        $levels = [
            'low' => 1,
            'medium' => 2,
            'high' => 3,
            'critical' => 4
        ];

        return $levels[$this->severity] ?? 0;
    }

    /**
     * Vérifier si l'alerte est critique
     */
    public function getIsCriticalAttribute(): bool
    {
        return $this->severity === 'critical';
    }

    /**
     * Obtenir le pourcentage de stock par rapport au minimum
     */
    public function getStockPercentageAttribute(): float
    {
        if ($this->minimum_stock <= 0) {
            return 0;
        }

        return round(($this->current_stock / $this->minimum_stock) * 100, 2);
    }

    /**
     * Obtenir le texte de l'alerte en français
     */
    public function getAlertTextAttribute(): string
    {
        $types = [
            'out_of_stock' => 'Rupture de stock',
            'low_stock' => 'Stock faible',
            'excess_stock' => 'Stock excessif'
        ];

        return $types[$this->alert_type] ?? 'Alerte inconnue';
    }

    /**
     * Obtenir le texte de sévérité en français
     */
    public function getSeverityTextAttribute(): string
    {
        $severities = [
            'critical' => 'Critique',
            'high' => 'Élevée',
            'medium' => 'Moyenne',
            'low' => 'Faible'
        ];

        return $severities[$this->severity] ?? 'Inconnue';
    }

    // =====================================
    // MÉTHODES
    // =====================================

    /**
     * Résoudre l'alerte
     */
    public function resolve(?int $userId = null, ?string $notes = null, ?string $actionTaken = null): bool
    {
        return $this->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $userId,
            'notes' => $notes,
            'action_taken' => $actionTaken
        ]);
    }

    /**
     * Ignorer l'alerte
     */
    public function dismiss(?int $userId = null, ?string $notes = null): bool
    {
        return $this->update([
            'status' => 'dismissed',
            'dismissed_at' => now(),
            'resolved_by' => $userId,
            'notes' => $notes
        ]);
    }

    /**
     * Marquer la notification comme envoyée
     */
    public function markNotificationSent(): bool
    {
        return $this->update([
            'notification_sent' => true,
            'last_notification_at' => now()
        ]);
    }

    /**
     * Vérifier si l'alerte nécessite une escalade
     */
    public function needsEscalation(): bool
    {
        // Escalade si l'alerte est critique et existe depuis plus de 2 heures
        if ($this->severity === 'critical' && $this->created_at->diffInHours(now()) >= 2) {
            return true;
        }

        // Escalade si l'alerte est élevée et existe depuis plus de 24 heures
        if ($this->severity === 'high' && $this->created_at->diffInHours(now()) >= 24) {
            return true;
        }

        return false;
    }

    /**
     * Calculer la priorité de l'alerte (1 = plus prioritaire)
     */
    public function getPriority(): int
    {
        $typePriority = [
            'out_of_stock' => 1,
            'low_stock' => 2,
            'excess_stock' => 3
        ];

        $severityPriority = [
            'critical' => 1,
            'high' => 2,
            'medium' => 3,
            'low' => 4
        ];

        return ($typePriority[$this->alert_type] ?? 999) + ($severityPriority[$this->severity] ?? 999);
    }

    /**
     * Vérifier si l'alerte peut être auto-résolue
     */
    public function canAutoResolve(): bool
    {
        // Récupérer le stock actuel
        $currentStock = $this->warehouse->getStockForProduct($this->product_id);

        switch ($this->alert_type) {
            case 'out_of_stock':
                return $currentStock > 0;

            case 'low_stock':
                return $currentStock > $this->minimum_stock;

            case 'excess_stock':
                return $currentStock <= $this->maximum_stock;

            default:
                return false;
        }
    }

    // =====================================
    // MÉTHODES STATIQUES
    // =====================================

    /**
     * Créer une nouvelle alerte ou mettre à jour une existante
     */
    public static function createOrUpdate(array $data): self
    {
        $existingAlert = self::where('warehouse_id', $data['warehouse_id'])
            ->where('product_id', $data['product_id'])
            ->where('alert_type', $data['alert_type'])
            ->where('status', 'active')
            ->first();

        if ($existingAlert) {
            $existingAlert->update($data);
            return $existingAlert;
        }

        return self::create($data);
    }

    /**
     * Obtenir les statistiques des alertes
     */
    public static function getStats(): array
    {
        return [
            'total_active' => self::active()->count(),
            'critical' => self::active()->critical()->count(),
            'by_type' => [
                'out_of_stock' => self::active()->byType('out_of_stock')->count(),
                'low_stock' => self::active()->byType('low_stock')->count(),
                'excess_stock' => self::active()->byType('excess_stock')->count(),
            ],
            'by_severity' => [
                'critical' => self::active()->bySeverity('critical')->count(),
                'high' => self::active()->bySeverity('high')->count(),
                'medium' => self::active()->bySeverity('medium')->count(),
                'low' => self::active()->bySeverity('low')->count(),
            ],
            'needs_escalation' => self::active()->get()->filter->needsEscalation()->count(),
        ];
    }

    /**
     * Nettoyer les anciennes alertes résolues
     */
    public static function cleanupOldAlerts(int $daysOld = 30): int
    {
        return self::whereIn('status', ['resolved', 'dismissed'])
            ->where('resolved_at', '<', now()->subDays($daysOld))
            ->delete();
    }

    /**
     * Auto-résoudre les alertes qui ne sont plus valides
     */
    public static function autoResolveInvalidAlerts(): int
    {
        $resolved = 0;
        $activeAlerts = self::active()->with(['warehouse', 'product'])->get();

        foreach ($activeAlerts as $alert) {
            if ($alert->canAutoResolve()) {
                $alert->resolve(null, 'Auto-résolution - conditions normalisées', 'auto_resolve');
                $resolved++;
            }
        }

        return $resolved;
    }
}
