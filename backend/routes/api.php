<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Api\PaymentController; // AJOUT DE L'IMPORT MANQUANT
use App\Http\Middleware\IsSuperadmin;
use App\Http\Controllers\PublicLinkController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\ProductCategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\FranchiseOrderController;
use App\Http\Controllers\Api\StockController;



// Middleware CORS temporaire pour test
Route::options('{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN')
        ->header('Access-Control-Max-Age', '86400');
})->where('any', '.*');


// Routes publiques
Route::post('/franchisees', [FranchiseeController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/set-password', [AuthController::class, 'setPassword']);

// Webhooks Stripe (non protégés par auth)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleStripeWebhook']);
Route::post('/webhooks/test', [WebhookController::class, 'testWebhook']); // Pour les tests

// Routes protégées par l'authentification (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Route pour récupérer les informations de l'utilisateur connecté
    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // Route de déconnexion
    Route::post('/logout', [AuthController::class, 'logout']);

    // IMPORTANT: Routes spécifiques AVANT les routes avec paramètres
    // Routes pour récupérer les franchisés par statut (AVANT /franchisees/{id})
    Route::get('/franchisees/unvalidated', [FranchiseeController::class, 'getUnvalidated']);
    Route::get('/franchisees/validated', [FranchiseeController::class, 'getValidated']);

    // Route pour la création d'intention de paiement Stripe
    Route::post('/franchisees/create-payment-intent', [FranchiseeController::class, 'createPaymentIntent']);

    // Routes pour la gestion des franchisés (génériques APRÈS les spécifiques)
    Route::get('/franchisees', [FranchiseeController::class, 'index']);
    Route::get('/franchisees/{id}', [FranchiseeController::class, 'show']);

    // Routes pour la gestion des statuts et validations
    Route::patch('/franchisees/{id}/status', [FranchiseeController::class, 'toggleStatus']);
    Route::patch('/franchisees/{id}/validate', [FranchiseeController::class, 'validate']);
    Route::patch('/franchisees/{id}/reject', [FranchiseeController::class, 'reject']);

    // Routes pour les franchisés - Système de paiement
    Route::prefix('payments')->group(function () {
        // Dashboard financier
        Route::get('/dashboard', [PaymentController::class, 'getDashboard']);

        // Transactions
        Route::get('/transactions', [PaymentController::class, 'getTransactions']);
        Route::get('/transactions/{id}', [PaymentController::class, 'getTransaction']);

        // Historique des mouvements de compte
        Route::get('/account-movements', [PaymentController::class, 'getAccountMovements']);

        // Créer une intention de paiement Stripe
        Route::post('/create-payment-intent', [PaymentController::class, 'createPaymentIntent']);
        Route::get('/stock-purchases', [PaymentController::class, 'getStockPurchases']);
        Route::post('/pay-stock-invoice/{transactionId}', [PaymentController::class, 'payStockInvoice']);
    });

    // Routes pour les administrateurs uniquement
    Route::prefix('admin/payments')->middleware('admin')->group(function () {
        // Gestion des transactions
        Route::post('/calculate-royalties', [PaymentController::class, 'calculateRoyalties']);
        Route::patch('/transactions/{id}/cancel', [PaymentController::class, 'cancelTransaction']);

        // Ajustements de compte
        Route::post('/account-adjustments', [PaymentController::class, 'createAccountAdjustment']);

        // Statistiques
        Route::get('/stats', [PaymentController::class, 'getPaymentStats']);

        // Dashboard admin (toutes les transactions)
        Route::get('/all-transactions', function(Request $request) {
            $query = \App\Models\Transaction::with(['user', 'paymentType', 'franchiseContract']);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('franchisee_id')) {
                $query->where('user_id', $request->franchisee_id);
            }

            $perPage = $request->get('per_page', 20);
            $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $transactions
            ]);
        });

        // Comptes de tous les franchisés
        Route::get('/all-accounts', function(Request $request) {
            $accounts = \App\Models\FranchiseeAccount::with(['user'])
                ->when($request->has('status'), function($q) use ($request) {
                    $q->where('account_status', $request->status);
                })
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $accounts
            ]);
        });
    });
});

// Routes protégées par l'authentification et le rôle superadmin
Route::middleware(['auth:sanctum', 'superadmin'])->group(function () {
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
});



Route::prefix('public')->group(function () {
    // 4.1 Afficher contrat (métadonnées et url PDF)
    Route::get('contract/{token}', [PublicLinkController::class, 'getContract']);
    // 4.2 Accepter contrat
    Route::post('contract/{token}/accept', [PublicLinkController::class, 'acceptContract']);
    // 4.3 Créer PaymentIntent pour droit d'entrée
    Route::post('entry-fee/{token}/create-payment-intent', [PublicLinkController::class, 'createEntryFeeIntent']);

    // Afficher le PDF directement (CORRIGÉE)
    Route::get('contract/{token}/view', [PublicLinkController::class, 'contract'])->name('public.contract.view');
});






// Routes protégées par l'authentification
Route::middleware(['auth:sanctum'])->group(function () {

    // === GESTION DES ENTREPÔTS ===
    Route::prefix('warehouses')->group(function () {
        Route::get('/', [WarehouseController::class, 'index']);
        Route::get('/{id}', [WarehouseController::class, 'show']);
        Route::get('/{id}/stocks', [WarehouseController::class, 'stocks']);
        Route::get('/{id}/alerts', [WarehouseController::class, 'stockAlerts']);

        // Routes admin uniquement (utilise votre middleware IsAdmin)
        Route::middleware('admin')->group(function () {
            Route::post('/', [WarehouseController::class, 'store']);
            Route::put('/{id}', [WarehouseController::class, 'update']);
            Route::delete('/{id}', [WarehouseController::class, 'destroy']);
            Route::patch('/{warehouseId}/products/{productId}/stock', [WarehouseController::class, 'updateStock']);
            Route::post('/{warehouseId}/products/{productId}/add-stock', [WarehouseController::class, 'addStock']);
        });
    });

    // === GESTION DES CATÉGORIES ===
    Route::prefix('product-categories')->group(function () {
        Route::get('/', [ProductCategoryController::class, 'index']);
        Route::get('/{id}', [ProductCategoryController::class, 'show']);

        // Routes admin uniquement
        Route::middleware('admin')->group(function () {
            Route::post('/', [ProductCategoryController::class, 'store']);
            Route::put('/{id}', [ProductCategoryController::class, 'update']);
            Route::delete('/{id}', [ProductCategoryController::class, 'destroy']);
            Route::patch('/{id}/toggle-status', [ProductCategoryController::class, 'toggleStatus']);
            Route::post('/reorder', [ProductCategoryController::class, 'reorder']);
        });
    });

    // === GESTION DES PRODUITS ===
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::get('/warehouse/{warehouseId}/catalog', [ProductController::class, 'catalog']);
        Route::get('/alerts/stock', [ProductController::class, 'stockAlerts']);

        // Routes admin uniquement
        Route::middleware('admin')->group(function () {
            Route::post('/', [ProductController::class, 'store']);
            Route::put('/{id}', [ProductController::class, 'update']);
            Route::delete('/{id}', [ProductController::class, 'destroy']);
            Route::post('/{id}/duplicate', [ProductController::class, 'duplicate']);
            Route::post('/bulk-import', [ProductController::class, 'bulkImport']);
        });
    });

    // === GESTION DES COMMANDES ===
    Route::prefix('orders')->group(function () {
        Route::get('/', [FranchiseOrderController::class, 'index']);
        Route::get('/{id}', [FranchiseOrderController::class, 'show']);
        Route::post('/', [FranchiseOrderController::class, 'store']);
        Route::put('/{id}', [FranchiseOrderController::class, 'update']);
        Route::delete('/{id}', [FranchiseOrderController::class, 'cancel']);
        Route::get('/stats/summary', [FranchiseOrderController::class, 'stats']);

        // Gestion du panier/contenu de commande
        Route::post('/{id}/items', [FranchiseOrderController::class, 'addItem']);
        Route::put('/{orderId}/items/{itemId}', [FranchiseOrderController::class, 'updateItem']);
        Route::delete('/{orderId}/items/{itemId}', [FranchiseOrderController::class, 'removeItem']);

        // Actions sur les commandes
        Route::patch('/{id}/submit', [FranchiseOrderController::class, 'submit']);

        // Routes admin uniquement
        Route::middleware('admin')->group(function () {
            Route::patch('/{id}/confirm', [FranchiseOrderController::class, 'confirm']);
            Route::patch('/{id}/status', [FranchiseOrderController::class, 'updateStatus']);
        });
    });

    // === GESTION DES STOCKS ===
    Route::prefix('stock')->group(function () {
        Route::get('/movements', [StockController::class, 'movements']);
        Route::get('/overview', [StockController::class, 'overview']);
        Route::get('/alerts', [StockController::class, 'alerts']);
        Route::get('/valuation', [StockController::class, 'valuation']);
        Route::get('/products/{productId}/history', [StockController::class, 'productHistory']);
        Route::get('/reorder-suggestions', [StockController::class, 'reorderSuggestions']);

        // Routes admin uniquement
        Route::middleware('admin')->group(function () {
            Route::post('/adjustment', [StockController::class, 'adjustment']);
            Route::post('/stock-in', [StockController::class, 'stockIn']);
            Route::post('/stock-out', [StockController::class, 'stockOut']);
            Route::post('/transfer', [StockController::class, 'transfer']);
        });
    });
});

// Routes publiques pour le catalogue (franchisés non connectés)
Route::get('/public/warehouses/{warehouseId}/catalog', [ProductController::class, 'catalog']);
