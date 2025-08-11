<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\WebhookController;
use App\Http\Controllers\Api\PaymentController; // AJOUT DE L'IMPORT MANQUANT
use App\Http\Middleware\IsSuperadmin;

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
