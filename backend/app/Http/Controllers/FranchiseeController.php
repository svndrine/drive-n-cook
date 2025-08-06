<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Franchisee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class FranchiseeController extends Controller
{

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'zip_code' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'current_situation' => 'nullable|string|max:255',
            'desired_zone' => 'nullable|string|max:255',
            'financial_contribution' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $randomPassword = Str::random(10);

            $user = \App\Models\User::create([
                'email' => $validatedData['email'],
                'password' => bcrypt($randomPassword),
                'role' => 'franchisee',
                'is_active' => false,
                'firstname' => $validatedData['first_name'],
                'lastname' => $validatedData['last_name'],
            ]);

            // Création du franchisé - AVEC first_name et last_name
            Franchisee::create([
                'user_id' => $user->id,
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'phone' => $validatedData['phone'],
                'address' => $validatedData['address'],
                'zip_code' => $validatedData['zip_code'],
                'city' => $validatedData['city'],
                'current_situation' => $validatedData['current_situation'],
                'desired_zone' => $validatedData['desired_zone'],
                'financial_contribution' => $validatedData['financial_contribution'],
            ]);

            $token = Str::random(60);
            DB::table('password_reset_tokens')->insert([
                'email' => $user->email,
                'token' => $token,
                'created_at' => Carbon::now()
            ]);

            // Envoie de l'email avec le lien pour définir le mot de passe
            //Mail::to($user->email)->send(new SetPasswordMail($token));

            DB::commit();

            return response()->json(['message' => 'Demande de franchisé créée. Un email a été envoyé pour définir le mot de passe.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            // En développement, retournez l'erreur complète
            return response()->json([
                'message' => 'Erreur lors de la création du franchisé.',
                'error' => $e->getMessage(),
                'file' => basename($e->getFile()),
                'line' => $e->getLine()
            ], 500);
        }
    }


    public function index()
    {
        $user = Auth::user();

        // Seuls les admins et superadmins peuvent accéder à la liste
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // On récupère les franchisés avec leur user associé
        $franchisees = Franchisee::with('user')->get();

        // On transforme la collection pour inclure les champs - UTILISEZ L'ID USER
        $transformedFranchisees = $franchisees->map(function ($franchisee) {
            return [
                'id' => $franchisee->user->id, // <- CHANGÉ : utiliser l'ID user comme les autres méthodes
                'first_name' => $franchisee->first_name,
                'last_name' => $franchisee->last_name,
                'email' => $franchisee->user->email,
                'is_active' => $franchisee->user->is_active,
                // Ajoutons aussi les autres champs pour la cohérence
                'phone' => $franchisee->phone,
                'city' => $franchisee->city,
                'zip_code' => $franchisee->zip_code,
                'address' => $franchisee->address,
                'current_situation' => $franchisee->current_situation,
                'desired_zone' => $franchisee->desired_zone,
                'financial_contribution' => $franchisee->financial_contribution,
                'created_at' => $franchisee->user->created_at,
            ];
        });

        return response()->json($transformedFranchisees);
    }

    public function toggleStatus($id, Request $request)
    {
        $user = Auth::user();

        // Vérifie que seul un admin ou superadmin peut faire ça
        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Valide que le champ is_active est bien présent et booléen
        $validated = $request->validate([
            'is_active' => 'required|boolean'
        ]);

        // CORRECTION : Trouve l'utilisateur par son ID (pas le franchisé)
        $targetUser = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$targetUser || !$targetUser->franchisee) {
            return response()->json(['message' => 'Franchisé non trouvé'], 404);
        }

        // Mise à jour du champ is_active dans users
        $targetUser->is_active = $validated['is_active'];
        $targetUser->save();

        // Retourne les données mises à jour
        return response()->json([
            'message' => 'Statut du franchisé mis à jour.',
            'franchisee' => [
                'id' => $targetUser->id, // ID user
                'first_name' => $targetUser->franchisee->first_name,
                'last_name' => $targetUser->franchisee->last_name,
                'email' => $targetUser->email,
                'is_active' => $targetUser->is_active
            ]
        ]);
    }


    public function getValidated()
    {
        $validated = User::where('role', 'franchisee')
            ->where('is_active', true)
            ->with('franchisee')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id, // Gardez l'ID utilisateur pour la compatibilité
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'first_name' => $user->franchisee->first_name ?? null,
                    'last_name' => $user->franchisee->last_name ?? null,
                    'phone' => $user->franchisee->phone ?? null,
                    'city' => $user->franchisee->city ?? null,
                    'zip_code' => $user->franchisee->zip_code ?? null,
                    'address' => $user->franchisee->address ?? null,
                    'current_situation' => $user->franchisee->current_situation ?? null,
                    'desired_zone' => $user->franchisee->desired_zone ?? null,
                    'financial_contribution' => $user->franchisee->financial_contribution ?? null,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($validated);
    }

    public function getUnvalidated()
    {
        $unvalidated = User::where('role', 'franchisee')
            ->where('is_active', false)
            ->with('franchisee')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id, // Gardez l'ID utilisateur pour la compatibilité
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'first_name' => $user->franchisee->first_name ?? null,
                    'last_name' => $user->franchisee->last_name ?? null,
                    'phone' => $user->franchisee->phone ?? null,
                    'city' => $user->franchisee->city ?? null,
                    'zip_code' => $user->franchisee->zip_code ?? null,
                    'address' => $user->franchisee->address ?? null,
                    'current_situation' => $user->franchisee->current_situation ?? null,
                    'desired_zone' => $user->franchisee->desired_zone ?? null,
                    'financial_contribution' => $user->franchisee->financial_contribution ?? null,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($unvalidated);
    }

    public function show($id)
    {
        // Chercher l'utilisateur avec son franchisee par ID utilisateur
        $user = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        if (!$user->franchisee) {
            return response()->json(['message' => 'Données de franchisé non trouvées'], 404);
        }

        $franchisee = $user->franchisee;

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'first_name' => $franchisee->first_name,
            'last_name' => $franchisee->last_name,
            'phone' => $franchisee->phone,
            'address' => $franchisee->address,
            'zip_code' => $franchisee->zip_code,
            'city' => $franchisee->city,
            'current_situation' => $franchisee->current_situation,
            'desired_zone' => $franchisee->desired_zone,
            'financial_contribution' => $franchisee->financial_contribution,
            'created_at' => $user->created_at,
        ]);
    }

    public function createPaymentIntent(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'franchisee' || !$user->is_active) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $franchisee = $user->franchisee;

        if ($franchisee->has_paid) {
            return response()->json(['message' => 'Déjà payé'], 400);
        }

        Stripe::setApiKey(env('STRIPE_SECRET'));

        $intent = PaymentIntent::create([
            'amount' => 5000000, // en centimes => 50 000 €
            'currency' => 'eur',
            'metadata' => [
                'user_id' => $user->id,
                'franchisee_id' => $franchisee->id
            ],
        ]);

        return response()->json([
            'clientSecret' => $intent->client_secret,
        ]);
    }



}
