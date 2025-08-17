<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarehouseStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'quantity',
        'reserved_quantity',
        'last_restock_date'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'reserved_quantity' => 'integer',
        'last_restock_date' => 'date'
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

    // Scopes
    public function scopeLowStock($query)
    {
        return $query->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
            ->select('warehouse_stocks.*');
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', '<=', 0);
    }

    public function scopeAvailable($query)
    {
        return $query->whereRaw('quantity > reserved_quantity');
    }

    // Méthodes utiles
    public function getAvailableQuantity()
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    public function isLowStock()
    {
        return $this->quantity <= $this->product->minimum_stock;
    }

    public function isOutOfStock()
    {
        return $this->quantity <= 0;
    }

    public function canReserve($requestedQuantity)
    {
        return $this->getAvailableQuantity() >= $requestedQuantity;
    }

    public function reserveQuantity($quantity)
    {
        if ($this->canReserve($quantity)) {
            $this->increment('reserved_quantity', $quantity);
            return true;
        }
        return false;
    }

    public function releaseReservedQuantity($quantity)
    {
        $this->decrement('reserved_quantity', min($quantity, $this->reserved_quantity));
    }

    public function updateStock($quantity, $reason = null, $orderId = null, $userId = null)
    {
        $oldQuantity = $this->quantity;
        $newQuantity = max(0, $oldQuantity + $quantity);

        $this->update([
            'quantity' => $newQuantity,
            'last_restock_date' => $quantity > 0 ? now() : $this->last_restock_date
        ]);

        // Créer un mouvement de stock
        StockMovement::create([
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'type' => $quantity > 0 ? 'in' : 'out',
            'quantity' => $quantity,
            'quantity_before' => $oldQuantity,
            'quantity_after' => $newQuantity,
            'reason' => $reason,
            'order_id' => $orderId,
            'user_id' => $userId
        ]);

        return $this;
    }

    public function getStockValue()
    {
        return $this->quantity * $this->product->purchase_price;
    }

    public function getStockAge()
    {
        return $this->last_restock_date ?
            $this->last_restock_date->diffInDays(now()) :
            null;
    }
}
