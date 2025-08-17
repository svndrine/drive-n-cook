<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'postal_code',
        'phone',
        'email',
        'opening_hours',
        'is_active',
        'latitude',
        'longitude'
    ];

    protected $casts = [
        'opening_hours' => 'array',
        'is_active' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8'
    ];

    // Relations
    public function stocks()
    {
        return $this->hasMany(WarehouseStock::class);
    }

    public function orders()
    {
        return $this->hasMany(FranchiseOrder::class);
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Méthodes utiles
    public function getStockForProduct($productId)
    {
        return $this->stocks()->where('product_id', $productId)->first();
    }

    public function getAvailableStockForProduct($productId)
    {
        $stock = $this->getStockForProduct($productId);
        return $stock ? ($stock->quantity - $stock->reserved_quantity) : 0;
    }

    public function getTotalStockValue()
    {
        return $this->stocks()
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->sum(\DB::raw('warehouse_stocks.quantity * products.purchase_price'));
    }
}
