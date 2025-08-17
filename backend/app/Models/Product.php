<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'description',
        'category_id',
        'type',
        'purchase_price',
        'selling_price',
        'unit',
        'vat_rate',
        'is_mandatory',
        'is_active',
        'minimum_stock',
        'maximum_stock',
        'allergens',
        'image_url'
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
        'minimum_stock' => 'integer',
        'maximum_stock' => 'integer',
        'allergens' => 'array'
    ];

    // Relations
    public function category()
    {
        return $this->belongsTo(ProductCategory::class);
    }

    public function warehouseStocks()
    {
        return $this->hasMany(WarehouseStock::class);
    }

    public function orderItems()
    {
        return $this->hasMany(FranchiseOrderItem::class);
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

    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }

    public function scopeOptional($query)
    {
        return $query->where('is_mandatory', false);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeLowStock($query, $warehouseId = null)
    {
        $query = $query->join('warehouse_stocks', 'products.id', '=', 'warehouse_stocks.product_id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock');

        if ($warehouseId) {
            $query->where('warehouse_stocks.warehouse_id', $warehouseId);
        }

        return $query->select('products.*');
    }

    // Méthodes utiles
    public function getTotalStockAcrossWarehouses()
    {
        return $this->warehouseStocks()->sum('quantity');
    }

    public function getStockInWarehouse($warehouseId)
    {
        $stock = $this->warehouseStocks()->where('warehouse_id', $warehouseId)->first();
        return $stock ? $stock->quantity : 0;
    }

    public function getAvailableStockInWarehouse($warehouseId)
    {
        $stock = $this->warehouseStocks()->where('warehouse_id', $warehouseId)->first();
        return $stock ? ($stock->quantity - $stock->reserved_quantity) : 0;
    }

    public function getPriceWithVat()
    {
        return $this->selling_price * (1 + $this->vat_rate / 100);
    }

    public function getMarginPercentage()
    {
        if ($this->purchase_price == 0) return 0;
        return (($this->selling_price - $this->purchase_price) / $this->purchase_price) * 100;
    }

    public function isLowStockInWarehouse($warehouseId)
    {
        return $this->getStockInWarehouse($warehouseId) <= $this->minimum_stock;
    }
}
