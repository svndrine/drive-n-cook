<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Middleware\IsSuperadmin;

// Routes publiques
Route::post('/franchisees', [FranchiseeController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/set-password', [AuthController::class, 'setPassword']);

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
    Route::patch('/franchisees/{id}/validate', [FranchiseeController::class, 'validate']); // NOUVELLE ROUTE
    Route::patch('/franchisees/{id}/reject', [FranchiseeController::class, 'reject']);     // NOUVELLE ROUTE
});

// Routes protégées par l'authentification et le rôle superadmin
Route::middleware(['auth:sanctum', 'superadmin'])->group(function () {
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
});
