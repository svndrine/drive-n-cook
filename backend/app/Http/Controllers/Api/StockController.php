<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use App\Models\WarehouseStock;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    /**
     * Historique des mouvements de stock
     */
    public function movements(Request $request): JsonResponse
    {
        $query = StockMovement::with(['warehouse', 'product.category', 'user', 'order']);

        // Filtres
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->get('warehouse_id'));
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->get('product_id'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->get('user_id'));
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 50);
        $movements = $query->paginate($perPage);

        // Ajouter des informations calculées
        $movements->getCollection()->each(function($movement) {
            $movement->absolute_quantity = $movement->getAbsoluteQuantity();
            $movement->impact_value = $movement->getImpactValue();
            $movement->type_label = $movement->getTypeLabelAttribute();
        });

        return response()->json([
            'success' => true,
            'data' => $movements
        ]);
    }

    /**
     * Résumé des stocks par entrepôt
     */
    public function overview(Request $request): JsonResponse
    {
        $query = WarehouseStock::with(['warehouse', 'product.category']);

        // Filtres
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->get('warehouse_id'));
        }

        if ($request->has('category_id')) {
            $query->whereHas('product', function($q) use ($request) {
                $q->where('category_id', $request->get('category_id'));
            });
        }

        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
                ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
                ->select('warehouse_stocks.*');
        }

        if ($request->has('out_of_stock') && $request->boolean('out_of_stock')) {
            $query->where('quantity', '<=', 0);
        }

        $stocks = $query->get();

        // Calculer les statistiques globales
        $stats = [
            'total_products' => $stocks->count(),
            'total_value' => $stocks->sum(function($stock) {
                return $stock->getStockValue();
            }),
            'low_stock_count' => $stocks->filter(function($stock) {
                return $stock->isLowStock();
            })->count(),
            'out_of_stock_count' => $stocks->filter(function($stock) {
                return $stock->isOutOfStock();
            })->count(),
            'by_warehouse' => $stocks->groupBy('warehouse.name')->map(function($warehouseStocks) {
                return [
                    'products_count' => $warehouseStocks->count(),
                    'total_value' => $warehouseStocks->sum(function($stock) {
                        return $stock->getStockValue();
                    }),
                    'low_stock_count' => $warehouseStocks->filter(function($stock) {
                        return $stock->isLowStock();
                    })->count()
                ];
            }),
            'by_category' => $stocks->groupBy('product.category.name')->map(function($categoryStocks) {
                return [
                    'products_count' => $categoryStocks->count(),
                    'total_value' => $categoryStocks->sum(function($stock) {
                        return $stock->getStockValue();
                    })
                ];
            })
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'stocks' => $stocks,
                'stats' => $stats
            ]
        ]);
    }

    /**
     * Alertes de stock (produits en rupture ou stock faible)
     */
    public function alerts(Request $request): JsonResponse
    {
        $warehouseId = $request->get('warehouse_id');

        // Stocks faibles
        $lowStockQuery = WarehouseStock::with(['warehouse', 'product.category'])
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
            ->where('warehouse_stocks.quantity', '>', 0)
            ->select('warehouse_stocks.*');

        // Ruptures de stock
        $outOfStockQuery = WarehouseStock::with(['warehouse', 'product.category'])
            ->where('quantity', '<=', 0);

        if ($warehouseId) {
            $lowStockQuery->where('warehouse_stocks.warehouse_id', $warehouseId);
            $outOfStockQuery->where('warehouse_id', $warehouseId);
        }

        $lowStock = $lowStockQuery->get();
        $outOfStock = $outOfStockQuery->get();

        // Produits avec stock excessif (au-dessus du maximum)
        $excessiveStockQuery = WarehouseStock::with(['warehouse', 'product.category'])
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->whereNotNull('products.maximum_stock')
            ->whereRaw('warehouse_stocks.quantity > products.maximum_stock')
            ->select('warehouse_stocks.*');

        if ($warehouseId) {
            $excessiveStockQuery->where('warehouse_stocks.warehouse_id', $warehouseId);
        }

        $excessiveStock = $excessiveStockQuery->get();

        return response()->json([
            'success' => true,
            'data' => [
                'low_stock' => $lowStock->map(function($stock) {
                    return array_merge($stock->toArray(), [
                        'available_quantity' => $stock->getAvailableQuantity(),
                        'stock_age' => $stock->getStockAge()
                    ]);
                }),
                'out_of_stock' => $outOfStock->map(function($stock) {
                    return array_merge($stock->toArray(), [
                        'stock_age' => $stock->getStockAge()
                    ]);
                }),
                'excessive_stock' => $excessiveStock->map(function($stock) {
                    return array_merge($stock->toArray(), [
                        'excess_quantity' => $stock->quantity - $stock->product->maximum_stock,
                        'stock_value' => $stock->getStockValue()
                    ]);
                }),
                'summary' => [
                    'low_stock_count' => $lowStock->count(),
                    'out_of_stock_count' => $outOfStock->count(),
                    'excessive_stock_count' => $excessiveStock->count(),
                    'total_alerts' => $lowStock->count() + $outOfStock->count() + $excessiveStock->count()
                ]
            ]
        ]);
    }

    /**
     * Effectuer un ajustement de stock
     */
    public function adjustment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'new_quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:255'
        ]);

        $warehouse = Warehouse::findOrFail($validated['warehouse_id']);
        $product = Product::findOrFail($validated['product_id']);

        $stock = WarehouseStock::firstOrCreate(
            ['warehouse_id' => $validated['warehouse_id'], 'product_id' => $validated['product_id']],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );

        $oldQuantity = $stock->quantity;
        $newQuantity = $validated['new_quantity'];
        $adjustment = $newQuantity - $oldQuantity;

        // Créer le mouvement d'ajustement
        $movement = StockMovement::createAdjustment(
            $validated['warehouse_id'],
            $validated['product_id'],
            $newQuantity,
            $validated['reason'],
            auth()->id()
        );

        // Mettre à jour le stock
        $stock->update(['quantity' => $newQuantity]);

        return response()->json([
            'success' => true,
            'message' => 'Ajustement de stock effectué avec succès',
            'data' => [
                'movement' => $movement,
                'stock' => $stock->fresh(),
                'adjustment' => [
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'difference' => $adjustment
                ]
            ]
        ]);
    }

    /**
     * Entrée de stock (réapprovisionnement)
     */
    public function stockIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reference' => 'nullable|string|max:255',
            'reason' => 'required|string|max:255'
        ]);

        $warehouse = Warehouse::findOrFail($validated['warehouse_id']);
        $product = Product::findOrFail($validated['product_id']);

        $stock = WarehouseStock::firstOrCreate(
            ['warehouse_id' => $validated['warehouse_id'], 'product_id' => $validated['product_id']],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );

        // Créer le mouvement d'entrée
        $movement = StockMovement::createEntry(
            $validated['warehouse_id'],
            $validated['product_id'],
            $validated['quantity'],
            $validated['reason'],
            auth()->id(),
            $validated['reference'] ?? null
        );

        // Mettre à jour le stock
        $stock->updateStock($validated['quantity'], $validated['reason'], null, auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Entrée de stock enregistrée avec succès',
            'data' => [
                'movement' => $movement,
                'stock' => $stock->fresh()
            ]
        ]);
    }

    /**
     * Sortie de stock manuelle
     */
    public function stockOut(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:255'
        ]);

        $warehouse = Warehouse::findOrFail($validated['warehouse_id']);
        $product = Product::findOrFail($validated['product_id']);

        $stock = WarehouseStock::where('warehouse_id', $validated['warehouse_id'])
            ->where('product_id', $validated['product_id'])
            ->first();

        if (!$stock || $stock->getAvailableQuantity() < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Stock insuffisant. Disponible: ' . ($stock ? $stock->getAvailableQuantity() : 0)
            ], 422);
        }

        // Créer le mouvement de sortie
        $movement = StockMovement::createExit(
            $validated['warehouse_id'],
            $validated['product_id'],
            $validated['quantity'],
            $validated['reason'],
            auth()->id()
        );

        // Mettre à jour le stock
        $stock->updateStock(-$validated['quantity'], $validated['reason'], null, auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Sortie de stock enregistrée avec succès',
            'data' => [
                'movement' => $movement,
                'stock' => $stock->fresh()
            ]
        ]);
    }

    /**
     * Transfert de stock entre entrepôts
     */
    public function transfer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_warehouse_id' => 'required|exists:warehouses,id',
            'to_warehouse_id' => 'required|exists:warehouses,id|different:from_warehouse_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|max:255'
        ]);

        $fromWarehouse = Warehouse::findOrFail($validated['from_warehouse_id']);
        $toWarehouse = Warehouse::findOrFail($validated['to_warehouse_id']);
        $product = Product::findOrFail($validated['product_id']);

        $fromStock = WarehouseStock::where('warehouse_id', $validated['from_warehouse_id'])
            ->where('product_id', $validated['product_id'])
            ->first();

        if (!$fromStock || $fromStock->getAvailableQuantity() < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Stock insuffisant dans l\'entrepôt source. Disponible: ' . ($fromStock ? $fromStock->getAvailableQuantity() : 0)
            ], 422);
        }

        DB::transaction(function() use ($validated, $fromStock) {
            $reference = 'TRANSFER-' . time();

            // Sortie de l'entrepôt source
            StockMovement::create([
                'warehouse_id' => $validated['from_warehouse_id'],
                'product_id' => $validated['product_id'],
                'type' => 'transfer',
                'quantity' => -$validated['quantity'],
                'quantity_before' => $fromStock->quantity,
                'quantity_after' => $fromStock->quantity - $validated['quantity'],
                'reason' => $validated['reason'],
                'user_id' => auth()->id(),
                'reference' => $reference
            ]);

            $fromStock->updateStock(-$validated['quantity'], $validated['reason'], null, auth()->id());

            // Entrée dans l'entrepôt destination
            $toStock = WarehouseStock::firstOrCreate(
                ['warehouse_id' => $validated['to_warehouse_id'], 'product_id' => $validated['product_id']],
                ['quantity' => 0, 'reserved_quantity' => 0]
            );

            StockMovement::create([
                'warehouse_id' => $validated['to_warehouse_id'],
                'product_id' => $validated['product_id'],
                'type' => 'transfer',
                'quantity' => $validated['quantity'],
                'quantity_before' => $toStock->quantity,
                'quantity_after' => $toStock->quantity + $validated['quantity'],
                'reason' => $validated['reason'],
                'user_id' => auth()->id(),
                'reference' => $reference
            ]);

            $toStock->updateStock($validated['quantity'], $validated['reason'], null, auth()->id());
        });

        return response()->json([
            'success' => true,
            'message' => 'Transfert de stock effectué avec succès'
        ]);
    }

    /**
     * Rapport de valorisation des stocks
     */
    public function valuation(Request $request): JsonResponse
    {
        $warehouseId = $request->get('warehouse_id');

        $query = WarehouseStock::with(['warehouse', 'product.category'])
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->select(
                'warehouse_stocks.*',
                'products.purchase_price',
                'products.selling_price',
                DB::raw('warehouse_stocks.quantity * products.purchase_price as purchase_value'),
                DB::raw('warehouse_stocks.quantity * products.selling_price as selling_value')
            );

        if ($warehouseId) {
            $query->where('warehouse_stocks.warehouse_id', $warehouseId);
        }

        $stocks = $query->get();

        $valuation = [
            'total_purchase_value' => $stocks->sum('purchase_value'),
            'total_selling_value' => $stocks->sum('selling_value'),
            'total_margin' => $stocks->sum('selling_value') - $stocks->sum('purchase_value'),
            'by_warehouse' => $stocks->groupBy('warehouse.name')->map(function($warehouseStocks) {
                return [
                    'purchase_value' => $warehouseStocks->sum('purchase_value'),
                    'selling_value' => $warehouseStocks->sum('selling_value'),
                    'margin' => $warehouseStocks->sum('selling_value') - $warehouseStocks->sum('purchase_value'),
                    'products_count' => $warehouseStocks->count()
                ];
            }),
            'by_category' => $stocks->groupBy('product.category.name')->map(function($categoryStocks) {
                return [
                    'purchase_value' => $categoryStocks->sum('purchase_value'),
                    'selling_value' => $categoryStocks->sum('selling_value'),
                    'margin' => $categoryStocks->sum('selling_value') - $categoryStocks->sum('purchase_value'),
                    'products_count' => $categoryStocks->count()
                ];
            }),
            'top_value_products' => $stocks->sortByDesc('purchase_value')->take(10)->values()
        ];

        return response()->json([
            'success' => true,
            'data' => $valuation
        ]);
    }

    /**
     * Historique des mouvements pour un produit spécifique
     */
    public function productHistory(Request $request, $productId): JsonResponse
    {
        $product = Product::findOrFail($productId);

        $query = StockMovement::with(['warehouse', 'user', 'order'])
            ->where('product_id', $productId);

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->get('warehouse_id'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        // Calculer l'évolution du stock
        $stockEvolution = [];
        $runningStock = 0;

        foreach ($movements->reverse() as $movement) {
            $runningStock = $movement->quantity_after;
            $stockEvolution[] = [
                'date' => $movement->created_at->format('Y-m-d H:i:s'),
                'type' => $movement->type,
                'quantity_change' => $movement->quantity,
                'stock_after' => $runningStock,
                'reason' => $movement->reason,
                'warehouse' => $movement->warehouse->name
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'product' => $product,
                'movements' => $movements,
                'stock_evolution' => $stockEvolution,
                'summary' => [
                    'total_movements' => $movements->count(),
                    'total_in' => $movements->where('quantity', '>', 0)->sum('quantity'),
                    'total_out' => abs($movements->where('quantity', '<', 0)->sum('quantity')),
                    'current_stock' => $product->getTotalStockAcrossWarehouses()
                ]
            ]
        ]);
    }

    /**
     * Prévisions de réapprovisionnement
     */
    public function reorderSuggestions(Request $request): JsonResponse
    {
        $warehouseId = $request->get('warehouse_id');
        $days = $request->get('days', 30); // Période d'analyse

        // Produits avec stock faible
        $lowStockQuery = WarehouseStock::with(['warehouse', 'product.category'])
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
            ->select('warehouse_stocks.*');

        if ($warehouseId) {
            $lowStockQuery->where('warehouse_stocks.warehouse_id', $warehouseId);
        }

        $lowStockProducts = $lowStockQuery->get();

        // Calculer la consommation moyenne pour chaque produit
        $suggestions = $lowStockProducts->map(function($stock) use ($days) {
            $movements = StockMovement::where('warehouse_id', $stock->warehouse_id)
                ->where('product_id', $stock->product_id)
                ->where('type', 'out')
                ->where('created_at', '>=', now()->subDays($days))
                ->get();

            $totalConsumed = abs($movements->sum('quantity'));
            $averageDailyConsumption = $totalConsumed / $days;
            $daysOfStockRemaining = $averageDailyConsumption > 0 ? $stock->quantity / $averageDailyConsumption : 999;

            $suggestedQuantity = max(
                $stock->product->minimum_stock - $stock->quantity,
                ceil($averageDailyConsumption * 14) // 2 semaines de stock
            );

            return [
                'stock' => $stock,
                'consumption_analysis' => [
                    'total_consumed_period' => $totalConsumed,
                    'average_daily_consumption' => round($averageDailyConsumption, 2),
                    'days_of_stock_remaining' => round($daysOfStockRemaining, 1),
                    'suggested_reorder_quantity' => $suggestedQuantity
                ],
                'priority' => $daysOfStockRemaining < 7 ? 'urgent' : ($daysOfStockRemaining < 14 ? 'high' : 'medium')
            ];
        })->sortBy('consumption_analysis.days_of_stock_remaining');

        return response()->json([
            'success' => true,
            'data' => [
                'suggestions' => $suggestions->values(),
                'summary' => [
                    'total_products' => $suggestions->count(),
                    'urgent_priority' => $suggestions->where('priority', 'urgent')->count(),
                    'high_priority' => $suggestions->where('priority', 'high')->count(),
                    'medium_priority' => $suggestions->where('priority', 'medium')->count()
                ]
            ]
        ]);
    }
}
