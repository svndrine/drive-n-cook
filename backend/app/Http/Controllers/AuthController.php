<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Valide les identifiants de l'utilisateur
        $credentials = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // Tente d'authentifier l'utilisateur
        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        // Récupère l'utilisateur authentifié
        $user = Auth::user();

        // Vérifie si le compte est actif
        if (! $user->is_active) {
            // Déconnecte l'utilisateur si le compte n'est pas actif
            Auth::logout();
            return response()->json(['message' => 'Compte inactif, veuillez attendre validation'], 403);
        }

        // Génération du token Bearer
        $token = $user->createToken('auth_token')->plainTextToken;

        // CORRECTION: Un seul return avec toutes les données
        return response()->json([
            'message' => 'Connexion réussie',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'is_active' => $user->is_active,
            ]
        ]);
    }

    public function setPassword(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $record = DB::table('password_reset_tokens')->where('token', $request->token)->first();

        if (!$record) {
            return response()->json(['message' => 'Token invalide ou expiré'], 400);
        }

        $user = User::where('email', $record->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $record->email)->delete();

        return response()->json(['message' => 'Mot de passe défini avec succès']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie'
        ]);
    }
}
