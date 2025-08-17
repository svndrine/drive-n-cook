<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'type',
        'quantity',
        'quantity_before',
        'quantity_after',
        'reference',
        'order_id',
        'reason',
        'user_id'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'quantity_before' => 'integer',
        'quantity_after' => 'integer'
    ];

    // Relations
    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(FranchiseOrder::class, 'order_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeIn($query)
    {
        return $query->where('type', 'in');
    }

    public function scopeOut($query)
    {
        return $query->where('type', 'out');
    }

    public function scopeForWarehouse($query, $warehouseId)
    {
        return $query->where('warehouse_id', $warehouseId);
    }

    public function scopeForProduct($query, $productId)
    {
        return $query->where('product_id', $productId);
    }

    public function scopeRecent($query, $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    // Méthodes utiles
    public function getTypeLabelAttribute()
    {
        $labels = [
            'in' => 'Entrée',
            'out' => 'Sortie',
            'adjustment' => 'Ajustement',
            'transfer' => 'Transfert'
        ];

        return $labels[$this->type] ?? $this->type;
    }

    public function isPositive()
    {
        return $this->quantity > 0;
    }

    public function isNegative()
    {
        return $this->quantity < 0;
    }

    public function getAbsoluteQuantity()
    {
        return abs($this->quantity);
    }

    public function getImpactValue()
    {
        return $this->quantity * $this->product->purchase_price;
    }

    // Méthodes statiques pour créer des mouvements spécifiques
    public static function createEntry($warehouseId, $productId, $quantity, $reason = null, $userId = null, $reference = null)
    {
        $stock = WarehouseStock::where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->first();

        $quantityBefore = $stock ? $stock->quantity : 0;
        $quantityAfter = $quantityBefore + $quantity;

        return self::create([
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'type' => 'in',
            'quantity' => $quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'reason' => $reason,
            'user_id' => $userId,
            'reference' => $reference
        ]);
    }

    public static function createExit($warehouseId, $productId, $quantity, $reason = null, $userId = null, $orderId = null)
    {
        $stock = WarehouseStock::where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->first();

        $quantityBefore = $stock ? $stock->quantity : 0;
        $quantityAfter = max(0, $quantityBefore - $quantity);

        return self::create([
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'type' => 'out',
            'quantity' => -$quantity,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $quantityAfter,
            'reason' => $reason,
            'user_id' => $userId,
            'order_id' => $orderId
        ]);
    }

    public static function createAdjustment($warehouseId, $productId, $newQuantity, $reason = null, $userId = null)
    {
        $stock = WarehouseStock::where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->first();

        $quantityBefore = $stock ? $stock->quantity : 0;
        $adjustment = $newQuantity - $quantityBefore;

        return self::create([
            'warehouse_id' => $warehouseId,
            'product_id' => $productId,
            'type' => 'adjustment',
            'quantity' => $adjustment,
            'quantity_before' => $quantityBefore,
            'quantity_after' => $newQuantity,
            'reason' => $reason,
            'user_id' => $userId
        ]);
    }
}
