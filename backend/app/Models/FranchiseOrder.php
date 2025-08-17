<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FranchiseOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'warehouse_id',
        'status',
        'total_ht',
        'total_tva',
        'total_ttc',
        'mandatory_percentage',
        'ratio_80_20_respected',
        'delivery_date',
        'delivery_address',
        'notes',
        'confirmed_at',
        'delivered_at'
    ];

    protected $casts = [
        'total_ht' => 'decimal:2',
        'total_tva' => 'decimal:2',
        'total_ttc' => 'decimal:2',
        'mandatory_percentage' => 'decimal:2',
        'ratio_80_20_respected' => 'boolean',
        'delivery_date' => 'datetime',
        'confirmed_at' => 'datetime',
        'delivered_at' => 'datetime'
    ];

    // Relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function franchisee()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function items()
    {
        return $this->hasMany(FranchiseOrderItem::class, 'order_id');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class, 'order_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['draft', 'pending']);
    }

    public function scopeConfirmed($query)
    {
        return $query->whereIn('status', ['confirmed', 'preparing', 'ready']);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'delivered');
    }

    public function scopeForWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    // Méthodes utiles
    public function generateOrderNumber()
    {
        $year = date('Y');
        $month = date('m');
        $lastOrder = self::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->orderBy('id', 'desc')
            ->first();

        $number = $lastOrder ? (intval(substr($lastOrder->order_number, -3)) + 1) : 1;

        return 'CMD-' . $year . $month . '-' . str_pad($number, 3, '0', STR_PAD_LEFT);
    }

    public function calculateTotals()
    {
        $totalHT = $this->items()->sum('total_ht');
        $totalTVA = $this->items()->sum('total_tva');
        $totalTTC = $this->items()->sum('total_ttc');

        $this->update([
            'total_ht' => $totalHT,
            'total_tva' => $totalTVA,
            'total_ttc' => $totalTTC
        ]);

        $this->calculateMandatoryPercentage();
    }

    public function calculateMandatoryPercentage()
    {
        $totalValue = $this->total_ht;
        $mandatoryValue = $this->items()
            ->join('products', 'franchise_order_items.product_id', '=', 'products.id')
            ->where('products.is_mandatory', true)
            ->sum('franchise_order_items.total_ht');

        $percentage = $totalValue > 0 ? ($mandatoryValue / $totalValue) * 100 : 0;
        $this->update([
            'mandatory_percentage' => $percentage,
            'ratio_80_20_respected' => $percentage >= 80
        ]);
    }

    public function canBeConfirmed()
    {
        return $this->status === 'pending' &&
            $this->items()->count() > 0 &&
            $this->ratio_80_20_respected;
    }

    public function confirm()
    {
        if ($this->canBeConfirmed()) {
            $this->update([
                'status' => 'confirmed',
                'confirmed_at' => now()
            ]);

            // Réserver les stocks
            $this->reserveStock();

            return true;
        }
        return false;
    }

    public function reserveStock()
    {
        foreach ($this->items as $item) {
            $stock = WarehouseStock::where('warehouse_id', $this->warehouse_id)
                ->where('product_id', $item->product_id)
                ->first();

            if ($stock) {
                $stock->reserveQuantity($item->quantity);
            }
        }
    }

    public function releaseStock()
    {
        foreach ($this->items as $item) {
            $stock = WarehouseStock::where('warehouse_id', $this->warehouse_id)
                ->where('product_id', $item->product_id)
                ->first();

            if ($stock) {
                $stock->releaseReservedQuantity($item->quantity);
            }
        }
    }

    public function processDelivery()
    {
        if (in_array($this->status, ['confirmed', 'preparing', 'ready'])) {
            // Déduire du stock réel et libérer les réservations
            foreach ($this->items as $item) {
                $stock = WarehouseStock::where('warehouse_id', $this->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($stock) {
                    $stock->updateStock(-$item->quantity, 'Commande livrée', $this->id, auth()->id());
                    $stock->releaseReservedQuantity($item->quantity);
                }
            }

            $this->update([
                'status' => 'delivered',
                'delivered_at' => now()
            ]);

            // 🔥 AJOUTER : Créer la transaction de paiement
            $this->createStockPurchaseTransaction();

            return true;
        }
        return false;
    }

    /**
     * Créer une transaction de paiement pour l'achat de stocks
     */
    private function createStockPurchaseTransaction()
    {
        // Créer la transaction
        $transaction = \App\Models\Transaction::create([
            'user_id' => $this->user_id,
            'amount' => $this->total_ttc,
            'transaction_type' => 'stock_purchase',
            'status' => 'pending',
            'description' => "Achat stocks - Commande {$this->order_number}",
            'due_date' => now()->addDays(30), // Paiement à 30 jours
            'order_reference' => $this->order_number
        ]);

        // Débiter le compte franchisé
        $franchiseeAccount = \App\Models\FranchiseeAccount::where('user_id', $this->user_id)->first();
        if ($franchiseeAccount) {
            $franchiseeAccount->debit(
                $this->total_ttc,
                "Achat stocks - Commande {$this->order_number}",
                $transaction
            );
        }

        return $transaction;
    }

    public function cancel()
    {
        if (in_array($this->status, ['draft', 'pending', 'confirmed'])) {
            if ($this->status === 'confirmed') {
                $this->releaseStock();
            }

            $this->update(['status' => 'cancelled']);
            return true;
        }
        return false;
    }

    public function getStatusLabelAttribute()
    {
        $labels = [
            'draft' => 'Brouillon',
            'pending' => 'En attente',
            'confirmed' => 'Confirmée',
            'preparing' => 'En préparation',
            'ready' => 'Prête',
            'delivered' => 'Livrée',
            'cancelled' => 'Annulée'
        ];

        return $labels[$this->status] ?? $this->status;
    }
}
