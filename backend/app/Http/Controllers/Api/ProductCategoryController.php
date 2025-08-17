<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ProductCategoryController extends Controller
{
    /**
     * Liste des catégories
     */
    public function index(Request $request): JsonResponse
    {
        $query = ProductCategory::query();

        // Filtres
        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Inclure le nombre de produits
        if ($request->boolean('with_counts')) {
            $query->withCount(['products', 'products as active_products_count' => function($q) {
                $q->where('is_active', true);
            }]);
        }

        $categories = $query->ordered()->get();

        // Ajouter des statistiques supplémentaires si demandées
        if ($request->boolean('with_stats')) {
            $categories->each(function($category) {
                $category->total_stock_value = $category->getTotalStockValue();
            });
        }

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Détails d'une catégorie
     */
    public function show(Request $request, $id): JsonResponse
    {
        $category = ProductCategory::findOrFail($id);

        // Charger les produits si demandé
        if ($request->boolean('with_products')) {
            $category->load(['products' => function($query) use ($request) {
                if ($request->has('active_only') && $request->boolean('active_only')) {
                    $query->where('is_active', true);
                }
                $query->orderBy('name');
            }]);
        }

        // Statistiques
        $category->stats = [
            'total_products' => $category->products()->count(),
            'active_products' => $category->products()->where('is_active', true)->count(),
            'mandatory_products' => $category->products()->where('is_mandatory', true)->count(),
            'total_stock_value' => $category->getTotalStockValue()
        ];

        return response()->json([
            'success' => true,
            'data' => $category
        ]);
    }

    /**
     * Créer une catégorie
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:product_categories,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean'
        ]);

        // Si aucun ordre n'est spécifié, mettre à la fin
        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = ProductCategory::max('sort_order') + 1;
        }

        $category = ProductCategory::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catégorie créée avec succès',
            'data' => $category
        ], 201);
    }

    /**
     * Mettre à jour une catégorie
     */
    public function update(Request $request, $id): JsonResponse
    {
        $category = ProductCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('product_categories', 'name')->ignore($id)],
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:255',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean'
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catégorie mise à jour avec succès',
            'data' => $category
        ]);
    }

    /**
     * Supprimer une catégorie
     */
    public function destroy($id): JsonResponse
    {
        $category = ProductCategory::findOrFail($id);

        // Vérifier s'il y a des produits dans cette catégorie
        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer cette catégorie car elle contient des produits'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Catégorie supprimée avec succès'
        ]);
    }

    /**
     * Réorganiser l'ordre des catégories
     */
    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:product_categories,id',
            'categories.*.sort_order' => 'required|integer|min:0'
        ]);

        foreach ($validated['categories'] as $categoryData) {
            ProductCategory::where('id', $categoryData['id'])
                ->update(['sort_order' => $categoryData['sort_order']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ordre des catégories mis à jour avec succès'
        ]);
    }

    /**
     * Activer/désactiver une catégorie
     */
    public function toggleStatus($id): JsonResponse
    {
        $category = ProductCategory::findOrFail($id);
        $category->update(['is_active' => !$category->is_active]);

        return response()->json([
            'success' => true,
            'message' => $category->is_active ? 'Catégorie activée' : 'Catégorie désactivée',
            'data' => $category
        ]);
    }
}
