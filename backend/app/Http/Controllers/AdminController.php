<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminController extends Controller
{
    /**
     * Affiche la liste de tous les administrateurs.
     */
    public function index()
    {
        Log::info('Début de la requête pour récupérer la liste des administrateurs.');

        try {
            // Le middleware 'superadmin' s'assure que seul un superadmin peut accéder à cette route.
            $admins = User::where('role', 'admin')->get(['id', 'firstname', 'lastname', 'email', 'role']);
            Log::info('Admins récupérés avec succès.');

            return response()->json($admins);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des administrateurs: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur interne du serveur'], 500);
        }
    }

    /**
     * Crée un nouvel administrateur.
     * Cette action est réservée aux super-administrateurs.
     */
    public function store(Request $request)
    {
        Log::info('Début de la requête pour créer un administrateur.');

        try {
            // Le middleware 'superadmin' gère déjà l'accès, mais on peut laisser cette vérification
            // pour plus de sécurité et de clarté.
            if (Auth::user()->role !== 'superadmin') {
                return response()->json(['message' => 'Accès interdit'], 403);
            }

            $validated = $request->validate([
                'firstname' => 'required|string|max:255',
                'lastname' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            Log::info('Données de création d\'administrateur validées.');

            $admin = User::create([
                'firstname' => $validated['firstname'],
                'lastname' => $validated['lastname'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'admin',
                'is_active' => true,
            ]);

            Log::info('Administrateur créé avec succès: ' . $admin->id);

            return response()->json(['message' => 'Administrateur créé avec succès', 'admin' => $admin], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Erreur de validation lors de la création de l\'administrateur: ' . $e->getMessage());
            return response()->json(['errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Erreur interne lors de la création de l\'administrateur: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur interne du serveur'], 500);
        }
    }

    /**
     * Supprime un administrateur.
     * Cette action est réservée aux super-administrateurs.
     */
    public function destroy($id)
    {
        Log::info('Début de la requête pour supprimer un administrateur: ' . $id);

        try {
            if (Auth::user()->role !== 'superadmin') {
                return response()->json(['message' => 'Accès interdit'], 403);
            }

            $admin = User::where('role', 'admin')->find($id);

            if (!$admin) {
                Log::warning('Tentative de suppression d\'un administrateur introuvable: ' . $id);
                return response()->json(['message' => 'Administrateur introuvable'], 404);
            }

            $admin->delete();

            Log::info('Administrateur supprimé avec succès: ' . $id);

            return response()->json(['message' => 'Administrateur supprimé avec succès']);

        } catch (\Exception $e) {
            Log::error('Erreur interne lors de la suppression de l\'administrateur: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur interne du serveur'], 500);
        }
    }
}
