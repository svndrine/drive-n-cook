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
    Route::get('/me', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/franchisees', [FranchiseeController::class, 'index']);
    Route::patch('/franchisees/{id}/status', [FranchiseeController::class, 'toggleStatus']);
});


// Routes protégées par l'authentification et le rôle superadmin
Route::middleware(['auth:sanctum', 'superadmin'])->group(function () {
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->get('/franchisees/unvalidated', [FranchiseeController::class, 'getUnvalidated']);

Route::middleware('auth:sanctum')->get('/franchisees/validated', [FranchiseeController::class, 'getValidated']);
Route::get('/franchisees/{id}', [FranchiseeController::class, 'show']);
