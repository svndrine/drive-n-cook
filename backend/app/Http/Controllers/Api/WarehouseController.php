<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class WarehouseController extends Controller
{
    /**
     * Liste des entrepôts
     */
    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::query();

        // Filtres
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $warehouses = $query->orderBy('name')->get();

        // Ajouter les statistiques si demandées
        if ($request->boolean('with_stats')) {
            $warehouses->each(function($warehouse) {
                $warehouse->loadCount(['stocks', 'orders']);
                $warehouse->total_stock_value = $warehouse->getTotalStockValue();
                $warehouse->low_stock_products = $warehouse->stocks()
                    ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
                    ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
                    ->count();
            });
        }

        return response()->json([
            'success' => true,
            'data' => $warehouses
        ]);
    }

    /**
     * Détails d'un entrepôt
     */
    public function show(Request $request, $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        // Charger les relations si demandées
        if ($request->boolean('with_stocks')) {
            $warehouse->load(['stocks.product.category']);
        }

        if ($request->boolean('with_orders')) {
            $warehouse->load(['orders' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(10);
            }, 'orders.franchisee']);
        }

        // Statistiques
        $warehouse->stats = [
            'total_products' => $warehouse->stocks()->count(),
            'total_stock_value' => $warehouse->getTotalStockValue(),
            'low_stock_count' => $warehouse->stocks()
                ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
                ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
                ->count(),
            'out_of_stock_count' => $warehouse->stocks()->where('quantity', '<=', 0)->count(),
            'pending_orders' => $warehouse->orders()->whereIn('status', ['pending', 'confirmed'])->count()
        ];

        return response()->json([
            'success' => true,
            'data' => $warehouse
        ]);
    }

    /**
     * Créer un entrepôt
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:warehouses,code',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'postal_code' => 'required|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'opening_hours' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'boolean'
        ]);

        $warehouse = Warehouse::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entrepôt créé avec succès',
            'data' => $warehouse
        ], 201);
    }

    /**
     * Mettre à jour un entrepôt
     */
    public function update(Request $request, $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => ['required', 'string', 'max:10', Rule::unique('warehouses', 'code')->ignore($id)],
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'postal_code' => 'required|string|max:10',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'opening_hours' => 'nullable|array',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_active' => 'boolean'
        ]);

        $warehouse->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entrepôt mis à jour avec succès',
            'data' => $warehouse
        ]);
    }

    /**
     * Supprimer un entrepôt
     */
    public function destroy($id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        // Vérifier s'il y a des stocks ou commandes
        if ($warehouse->stocks()->exists() || $warehouse->orders()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cet entrepôt car il contient des stocks ou des commandes'
            ], 422);
        }

        $warehouse->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entrepôt supprimé avec succès'
        ]);
    }

    /**
     * Stocks d'un entrepôt
     */
    public function stocks(Request $request, $id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $query = $warehouse->stocks()->with(['product.category']);

        // Filtres
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

        $stocks = $query->orderBy('updated_at', 'desc')->get();

        // Ajouter des informations calculées
        $stocks->each(function($stock) {
            $stock->available_quantity = $stock->getAvailableQuantity();
            $stock->is_low_stock = $stock->isLowStock();
            $stock->is_out_of_stock = $stock->isOutOfStock();
            $stock->stock_value = $stock->getStockValue();
        });

        return response()->json([
            'success' => true,
            'data' => $stocks
        ]);
    }

    /**
     * Mettre à jour le stock d'un produit dans un entrepôt
     */
    public function updateStock(Request $request, $warehouseId, $productId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
            'reason' => 'required|string|max:255'
        ]);

        $warehouse = Warehouse::findOrFail($warehouseId);
        $product = Product::findOrFail($productId);

        $stock = WarehouseStock::firstOrCreate(
            ['warehouse_id' => $warehouseId, 'product_id' => $productId],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );

        $oldQuantity = $stock->quantity;
        $newQuantity = $validated['quantity'];
        $adjustment = $newQuantity - $oldQuantity;

        $stock->updateStock($adjustment, $validated['reason'], null, auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Stock mis à jour avec succès',
            'data' => [
                'old_quantity' => $oldQuantity,
                'new_quantity' => $newQuantity,
                'adjustment' => $adjustment,
                'stock' => $stock->fresh()
            ]
        ]);
    }

    /**
     * Ajouter du stock (réapprovisionnement)
     */
    public function addStock(Request $request, $warehouseId, $productId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'reference' => 'nullable|string|max:255',
            'reason' => 'required|string|max:255'
        ]);

        $warehouse = Warehouse::findOrFail($warehouseId);
        $product = Product::findOrFail($productId);

        $stock = WarehouseStock::firstOrCreate(
            ['warehouse_id' => $warehouseId, 'product_id' => $productId],
            ['quantity' => 0, 'reserved_quantity' => 0]
        );

        $stock->updateStock($validated['quantity'], $validated['reason'], null, auth()->id());

        return response()->json([
            'success' => true,
            'message' => 'Stock ajouté avec succès',
            'data' => $stock->fresh()
        ]);
    }

    /**
     * Alertes de stock pour un entrepôt
     */
    public function stockAlerts($id): JsonResponse
    {
        $warehouse = Warehouse::findOrFail($id);

        $lowStock = $warehouse->stocks()
            ->with(['product.category'])
            ->join('products', 'warehouse_stocks.product_id', '=', 'products.id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
            ->select('warehouse_stocks.*')
            ->get();

        $outOfStock = $warehouse->stocks()
            ->with(['product.category'])
            ->where('quantity', '<=', 0)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
                'total_alerts' => $lowStock->count() + $outOfStock->count()
            ]
        ]);
    }
}
