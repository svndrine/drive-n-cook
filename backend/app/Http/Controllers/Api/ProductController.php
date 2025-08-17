<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\WarehouseStock;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Liste des produits avec filtres
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category']);

        // Filtres
        if ($request->has('category_id')) {
            $query->where('category_id', $request->get('category_id'));
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('is_mandatory')) {
            $query->where('is_mandatory', $request->boolean('is_mandatory'));
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Tri
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 20);
        $products = $query->paginate($perPage);

        // Ajouter les stocks si demandés
        if ($request->boolean('with_stocks')) {
            $products->getCollection()->each(function($product) use ($request) {
                if ($request->has('warehouse_id')) {
                    $product->stock = $product->getStockInWarehouse($request->get('warehouse_id'));
                    $product->available_stock = $product->getAvailableStockInWarehouse($request->get('warehouse_id'));
                } else {
                    $product->total_stock = $product->getTotalStockAcrossWarehouses();
                }
                $product->margin_percentage = $product->getMarginPercentage();
                $product->price_with_vat = $product->getPriceWithVat();
            });
        }

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }

    /**
     * Détails d'un produit
     */
    public function show(Request $request, $id): JsonResponse
    {
        $product = Product::with(['category'])->findOrFail($id);

        // Charger les stocks par entrepôt
        if ($request->boolean('with_stocks')) {
            $product->load(['warehouseStocks.warehouse']);
            $product->total_stock = $product->getTotalStockAcrossWarehouses();
        }

        // Statistiques
        $product->stats = [
            'margin_percentage' => $product->getMarginPercentage(),
            'price_with_vat' => $product->getPriceWithVat(),
            'total_orders' => $product->orderItems()->count(),
            'total_quantity_sold' => $product->orderItems()->sum('quantity'),
            'revenue_generated' => $product->orderItems()->sum('total_ttc')
        ];

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Créer un produit
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'description' => 'nullable|string',
            'category_id' => 'required|exists:product_categories,id',
            'type' => 'required|in:ingredient,prepared_dish,beverage',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'vat_rate' => 'required|numeric|min:0|max:100',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'allergens' => 'nullable|array',
            'image_url' => 'nullable|url'
        ]);

        // Validation: selling_price >= purchase_price
        if ($validated['selling_price'] < $validated['purchase_price']) {
            return response()->json([
                'success' => false,
                'message' => 'Le prix de vente doit être supérieur ou égal au prix d\'achat'
            ], 422);
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit créé avec succès',
            'data' => $product->load('category')
        ], 201);
    }

    /**
     * Mettre à jour un produit
     */
    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => ['required', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($id)],
            'description' => 'nullable|string',
            'category_id' => 'required|exists:product_categories,id',
            'type' => 'required|in:ingredient,prepared_dish,beverage',
            'purchase_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'vat_rate' => 'required|numeric|min:0|max:100',
            'is_mandatory' => 'boolean',
            'is_active' => 'boolean',
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'allergens' => 'nullable|array',
            'image_url' => 'nullable|url'
        ]);

        // Validation: selling_price >= purchase_price
        if ($validated['selling_price'] < $validated['purchase_price']) {
            return response()->json([
                'success' => false,
                'message' => 'Le prix de vente doit être supérieur ou égal au prix d\'achat'
            ], 422);
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit mis à jour avec succès',
            'data' => $product->load('category')
        ]);
    }

    /**
     * Supprimer un produit
     */
    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);

        // Vérifier s'il y a des stocks ou commandes
        if ($product->warehouseStocks()->exists() || $product->orderItems()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer ce produit car il est lié à des stocks ou des commandes'
            ], 422);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produit supprimé avec succès'
        ]);
    }

    /**
     * Catalogue produits pour un entrepôt (pour les franchisés)
     */
    public function catalog(Request $request, $warehouseId): JsonResponse
    {
        $query = Product::with(['category'])
            ->where('is_active', true)
            ->leftJoin('warehouse_stocks', function($join) use ($warehouseId) {
                $join->on('products.id', '=', 'warehouse_stocks.product_id')
                    ->where('warehouse_stocks.warehouse_id', '=', $warehouseId);
            })
            ->select('products.*', 'warehouse_stocks.quantity as stock_quantity', 'warehouse_stocks.reserved_quantity');

        // Filtres
        if ($request->has('category_id')) {
            $query->where('products.category_id', $request->get('category_id'));
        }

        if ($request->has('type')) {
            $query->where('products.type', $request->get('type'));
        }

        if ($request->has('available_only') && $request->boolean('available_only')) {
            $query->where('warehouse_stocks.quantity', '>', 0)
                ->whereRaw('warehouse_stocks.quantity > warehouse_stocks.reserved_quantity');
        }

        $products = $query->orderBy('products.name')->get();

        // Calculer les informations pour chaque produit
        $products->each(function($product) use ($warehouseId) {
            $product->available_quantity = max(0, ($product->stock_quantity ?? 0) - ($product->reserved_quantity ?? 0));
            $product->is_available = $product->available_quantity > 0;
            $product->price_with_vat = $product->getPriceWithVat();
            $product->is_low_stock = $product->isLowStockInWarehouse($warehouseId);
        });

        // Grouper par catégorie
        $groupedProducts = $products->groupBy('category.name');

        return response()->json([
            'success' => true,
            'data' => [
                'products' => $products,
                'grouped_by_category' => $groupedProducts,
                'mandatory_products' => $products->where('is_mandatory', true)->values(),
                'optional_products' => $products->where('is_mandatory', false)->values()
            ]
        ]);
    }

    /**
     * Produits en rupture ou stock faible
     */
    public function stockAlerts(Request $request): JsonResponse
    {
        $warehouseId = $request->get('warehouse_id');

        $lowStockQuery = Product::with(['category'])
            ->join('warehouse_stocks', 'products.id', '=', 'warehouse_stocks.product_id')
            ->whereRaw('warehouse_stocks.quantity <= products.minimum_stock')
            ->select('products.*', 'warehouse_stocks.quantity as current_stock', 'warehouse_stocks.warehouse_id');

        $outOfStockQuery = Product::with(['category'])
            ->join('warehouse_stocks', 'products.id', '=', 'warehouse_stocks.product_id')
            ->where('warehouse_stocks.quantity', '<=', 0)
            ->select('products.*', 'warehouse_stocks.quantity as current_stock', 'warehouse_stocks.warehouse_id');

        if ($warehouseId) {
            $lowStockQuery->where('warehouse_stocks.warehouse_id', $warehouseId);
            $outOfStockQuery->where('warehouse_stocks.warehouse_id', $warehouseId);
        }

        $lowStock = $lowStockQuery->get();
        $outOfStock = $outOfStockQuery->get();

        return response()->json([
            'success' => true,
            'data' => [
                'low_stock' => $lowStock,
                'out_of_stock' => $outOfStock,
                'summary' => [
                    'low_stock_count' => $lowStock->count(),
                    'out_of_stock_count' => $outOfStock->count(),
                    'total_alerts' => $lowStock->count() + $outOfStock->count()
                ]
            ]
        ]);
    }

    /**
     * Dupliquer un produit
     */
    public function duplicate($id): JsonResponse
    {
        $originalProduct = Product::findOrFail($id);

        $newProduct = $originalProduct->replicate();
        $newProduct->name = $originalProduct->name . ' (Copie)';
        $newProduct->sku = $originalProduct->sku . '-COPY-' . time();
        $newProduct->save();

        return response()->json([
            'success' => true,
            'message' => 'Produit dupliqué avec succès',
            'data' => $newProduct->load('category')
        ], 201);
    }

    /**
     * Import de produits en lot (CSV)
     */
    public function bulkImport(Request $request): JsonResponse
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.name' => 'required|string|max:255',
            'products.*.sku' => 'required|string|max:100|unique:products,sku',
            'products.*.category_id' => 'required|exists:product_categories,id',
            'products.*.type' => 'required|in:ingredient,prepared_dish,beverage',
            'products.*.purchase_price' => 'required|numeric|min:0',
            'products.*.selling_price' => 'required|numeric|min:0',
            'products.*.unit' => 'required|string|max:20',
        ]);

        $created = [];
        $errors = [];

        foreach ($request->products as $index => $productData) {
            try {
                $product = Product::create(array_merge($productData, [
                    'vat_rate' => $productData['vat_rate'] ?? 20.00,
                    'is_mandatory' => $productData['is_mandatory'] ?? false,
                    'is_active' => $productData['is_active'] ?? true,
                    'minimum_stock' => $productData['minimum_stock'] ?? 10
                ]));
                $created[] = $product;
            } catch (\Exception $e) {
                $errors[] = [
                    'index' => $index,
                    'data' => $productData,
                    'error' => $e->getMessage()
                ];
            }
        }

        return response()->json([
            'success' => count($errors) === 0,
            'message' => count($created) . ' produits créés, ' . count($errors) . ' erreurs',
            'data' => [
                'created' => $created,
                'errors' => $errors
            ]
        ]);
    }
}
