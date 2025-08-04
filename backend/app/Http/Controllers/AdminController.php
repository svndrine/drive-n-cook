<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function store(Request $request)
    {
        // Vérifie que l'utilisateur est superadmin
        if (auth()->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Accès interdit'], 403);
        }

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = User::create([
            'firstname' => $validated['firstname'],
            'lastname' => $validated['lastname'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Administrateur créé avec succès', 'admin' => $admin], 201);
    }
}
