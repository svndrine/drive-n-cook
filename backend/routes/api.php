<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FranchiseeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;


Route::post('/franchisees', [FranchiseeController::class, 'store']);
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return $request->user();
});
Route::post('/set-password', [AuthController::class, 'setPassword']);

Route::middleware(['auth:sanctum', 'superadmin'])->group(function () {
    Route::post('/admins', [AdminController::class, 'store']);
});

