<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FranchiseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'unit_price_ht',
        'total_ht',
        'vat_rate',
        'total_tva',
        'total_ttc'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_ht' => 'decimal:2',
        'total_ht' => 'decimal:2',
        'vat_rate' => 'decimal:2',
        'total_tva' => 'decimal:2',
        'total_ttc' => 'decimal:2'
    ];

    // Relations
    public function order()
    {
        return $this->belongsTo(FranchiseOrder::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Événements du modèle
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->calculateTotals();
        });

        static::saved(function ($item) {
            $item->order->calculateTotals();
        });

        static::deleted(function ($item) {
            $item->order->calculateTotals();
        });
    }

    // Méthodes utiles
    public function calculateTotals()
    {
        $this->total_ht = $this->quantity * $this->unit_price_ht;
        $this->total_tva = $this->total_ht * ($this->vat_rate / 100);
        $this->total_ttc = $this->total_ht + $this->total_tva;
    }

    public function setFromProduct(Product $product, $quantity)
    {
        $this->product_id = $product->id;
        $this->quantity = $quantity;
        $this->unit_price_ht = $product->selling_price;
        $this->vat_rate = $product->vat_rate;
        $this->calculateTotals();
    }

    public function getUnitPriceTtcAttribute()
    {
        return $this->unit_price_ht * (1 + $this->vat_rate / 100);
    }

    public function isAvailableInStock()
    {
        $stock = WarehouseStock::where('warehouse_id', $this->order->warehouse_id)
            ->where('product_id', $this->product_id)
            ->first();

        return $stock && $stock->getAvailableQuantity() >= $this->quantity;
    }

    public function getAvailableStock()
    {
        $stock = WarehouseStock::where('warehouse_id', $this->order->warehouse_id)
            ->where('product_id', $this->product_id)
            ->first();

        return $stock ? $stock->getAvailableQuantity() : 0;
    }
}
