<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FranchiseOrder;
use App\Models\FranchiseOrderItem;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\WarehouseStock;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FranchiseOrderController extends Controller
{
    /**
     * Liste des commandes
     */
    public function index(Request $request): JsonResponse
    {
        $query = FranchiseOrder::with(['franchisee', 'warehouse']);

        // Filtres par rôle
        if (!auth()->user()->isAdmin()) {
            // Franchisé : seulement ses commandes
            $query->where('user_id', auth()->id());
        } else {
            // Admin : peut filtrer par franchisé
            if ($request->has('franchisee_id')) {
                $query->where('user_id', $request->get('franchisee_id'));
            }
        }

        // Autres filtres
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->get('warehouse_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 20);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Détails d'une commande
     */
    public function show(Request $request, $id): JsonResponse
    {
        $query = FranchiseOrder::with(['franchisee', 'warehouse', 'items.product.category']);

        // Vérifier les droits d'accès
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($id);

        // Ajouter des informations calculées sur les items
        $order->items->each(function($item) {
            $item->available_stock = $item->getAvailableStock();
            $item->is_available = $item->isAvailableInStock();
        });

        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }

    /**
     * Créer une nouvelle commande (brouillon)
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'delivery_date' => 'nullable|date|after:today',
            'delivery_address' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $warehouse = Warehouse::findOrFail($validated['warehouse_id']);

        if (!$warehouse->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cet entrepôt n\'est pas actif'
            ], 422);
        }

        $order = FranchiseOrder::create([
            'order_number' => (new FranchiseOrder())->generateOrderNumber(),
            'user_id' => auth()->id(),
            'warehouse_id' => $validated['warehouse_id'],
            'status' => 'draft',
            'delivery_date' => $validated['delivery_date'] ?? null,
            'delivery_address' => $validated['delivery_address'] ?? null,
            'notes' => $validated['notes'] ?? null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commande créée avec succès',
            'data' => $order->load(['warehouse', 'franchisee'])
        ], 201);
    }

    /**
     * Mettre à jour une commande (seulement en brouillon)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $query = FranchiseOrder::query();

        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($id);

        if ($order->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les commandes en brouillon peuvent être modifiées'
            ], 422);
        }

        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'delivery_date' => 'nullable|date|after:today',
            'delivery_address' => 'nullable|string',
            'notes' => 'nullable|string'
        ]);

        $order->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Commande mise à jour avec succès',
            'data' => $order->load(['warehouse', 'franchisee'])
        ]);
    }

    /**
     * Ajouter un produit à la commande
     */
    public function addItem(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $query = FranchiseOrder::query();
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($id);

        if (!in_array($order->status, ['draft', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible d\'ajouter des produits à une commande confirmée'
            ], 422);
        }

        $product = Product::findOrFail($validated['product_id']);

        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Ce produit n\'est pas disponible'
            ], 422);
        }

        // Vérifier le stock disponible
        $stock = WarehouseStock::where('warehouse_id', $order->warehouse_id)
            ->where('product_id', $product->id)
            ->first();

        if (!$stock || $stock->getAvailableQuantity() < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Stock insuffisant. Disponible: ' . ($stock ? $stock->getAvailableQuantity() : 0)
            ], 422);
        }

        // Vérifier si le produit est déjà dans la commande
        $existingItem = $order->items()->where('product_id', $product->id)->first();

        if ($existingItem) {
            $newQuantity = $existingItem->quantity + $validated['quantity'];

            if ($stock->getAvailableQuantity() < $newQuantity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock insuffisant pour cette quantité totale'
                ], 422);
            }

            $existingItem->update(['quantity' => $newQuantity]);
            $item = $existingItem;
        } else {
            $item = new FranchiseOrderItem();
            $item->order_id = $order->id;
            $item->setFromProduct($product, $validated['quantity']);
            $item->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Produit ajouté à la commande',
            'data' => $item->load('product')
        ]);
    }

    /**
     * Modifier la quantité d'un produit dans la commande
     */
    public function updateItem(Request $request, $orderId, $itemId): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1'
        ]);

        $query = FranchiseOrder::query();
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($orderId);

        if (!in_array($order->status, ['draft', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier une commande confirmée'
            ], 422);
        }

        $item = $order->items()->findOrFail($itemId);

        // Vérifier le stock disponible
        $stock = WarehouseStock::where('warehouse_id', $order->warehouse_id)
            ->where('product_id', $item->product_id)
            ->first();

        if (!$stock || $stock->getAvailableQuantity() < $validated['quantity']) {
            return response()->json([
                'success' => false,
                'message' => 'Stock insuffisant. Disponible: ' . ($stock ? $stock->getAvailableQuantity() : 0)
            ], 422);
        }

        $item->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'success' => true,
            'message' => 'Quantité mise à jour',
            'data' => $item->load('product')
        ]);
    }

    /**
     * Supprimer un produit de la commande
     */
    public function removeItem($orderId, $itemId): JsonResponse
    {
        $query = FranchiseOrder::query();
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($orderId);

        if (!in_array($order->status, ['draft', 'pending'])) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de modifier une commande confirmée'
            ], 422);
        }

        $item = $order->items()->findOrFail($itemId);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produit retiré de la commande'
        ]);
    }

    /**
     * Passer la commande en "en attente" (pour validation)
     */
    public function submit($id): JsonResponse
    {
        $query = FranchiseOrder::query();
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($id);

        if ($order->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Seules les commandes en brouillon peuvent être soumises'
            ], 422);
        }

        if ($order->items()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de soumettre une commande vide'
            ], 422);
        }

        // Vérifier le ratio 80/20
        $order->calculateMandatoryPercentage();

        if (!$order->ratio_80_20_respected) {
            return response()->json([
                'success' => false,
                'message' => 'Le ratio 80/20 n\'est pas respecté. Pourcentage actuel de produits obligatoires: ' . round($order->mandatory_percentage, 2) . '%'
            ], 422);
        }

        $order->update(['status' => 'pending']);

        return response()->json([
            'success' => true,
            'message' => 'Commande soumise avec succès',
            'data' => $order
        ]);
    }

    /**
     * Confirmer une commande (Admin uniquement)
     */
    public function confirm($id): JsonResponse
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée'
            ], 403);
        }

        $order = FranchiseOrder::findOrFail($id);

        if (!$order->canBeConfirmed()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette commande ne peut pas être confirmée'
            ], 422);
        }

        $confirmed = $order->confirm();

        if (!$confirmed) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la confirmation de la commande'
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commande confirmée avec succès',
            'data' => $order
        ]);
    }

    /**
     * Changer le statut d'une commande (Admin uniquement)
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        if (!auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Action non autorisée'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:confirmed,preparing,ready,delivered'
        ]);

        $order = FranchiseOrder::findOrFail($id);

        if ($validated['status'] === 'delivered') {
            $processed = $order->processDelivery();
            if (!$processed) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors du traitement de la livraison'
                ], 422);
            }
        } else {
            $order->update(['status' => $validated['status']]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour avec succès',
            'data' => $order
        ]);
    }

    /**
     * Annuler une commande
     */
    public function cancel($id): JsonResponse
    {
        $query = FranchiseOrder::query();

        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        }

        $order = $query->findOrFail($id);

        $cancelled = $order->cancel();

        if (!$cancelled) {
            return response()->json([
                'success' => false,
                'message' => 'Cette commande ne peut pas être annulée'
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Commande annulée avec succès',
            'data' => $order
        ]);
    }

    /**
     * Statistiques des commandes
     */
    public function stats(Request $request): JsonResponse
    {
        $query = FranchiseOrder::query();

        // Filtrer par franchisé si pas admin
        if (!auth()->user()->isAdmin()) {
            $query->where('user_id', auth()->id());
        } elseif ($request->has('franchisee_id')) {
            $query->where('user_id', $request->get('franchisee_id'));
        }

        // Période
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->get('date_from'));
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->get('date_to'));
        }

        $stats = [
            'total_orders' => $query->count(),
            'total_amount' => $query->sum('total_ttc'),
            'average_order_value' => $query->avg('total_ttc'),
            'orders_by_status' => $query->selectRaw('status, COUNT(*) as count, SUM(total_ttc) as total')
                ->groupBy('status')
                ->get(),
            'orders_by_warehouse' => $query->with('warehouse')
                ->selectRaw('warehouse_id, COUNT(*) as count, SUM(total_ttc) as total')
                ->groupBy('warehouse_id')
                ->get()
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}
