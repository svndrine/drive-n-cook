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
use Illuminate\Support\Facades\Log;
use App\Mail\SetPasswordMail;
use App\Services\PaymentService;

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

            // Mot de passe temporaire (mais pas envoyé tout de suite)
            $randomPassword = Str::random(10);

            $user = \App\Models\User::create([
                'email' => $validatedData['email'],
                'password' => bcrypt($randomPassword),
                'role' => 'franchisee',
                'is_active' => false, // Pas actif au début
                'firstname' => $validatedData['first_name'],
                'lastname' => $validatedData['last_name'],
            ]);

            // Création du franchisé
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

            DB::commit();

            return response()->json(['message' => 'Demande de franchisé créée. Elle sera étudiée par notre équipe.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();

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

    // Remplacez votre méthode toggleStatus dans FranchiseeController par celle-ci :

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

        // Trouve l'utilisateur par son ID
        $targetUser = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$targetUser || !$targetUser->franchisee) {
            return response()->json(['message' => 'Franchisé non trouvé'], 404);
        }

        // Sauvegarde l'ancien statut pour détecter si c'est une validation
        $wasInactive = !$targetUser->is_active;
        $isBeingActivated = $validated['is_active'] === true;

        try {
            // VALIDATION COMPLÈTE = Activation du système de paiement
            if ($wasInactive && $isBeingActivated) {

                // Utiliser le PaymentService pour créer tout le système
                $paymentService = app(\App\Services\PaymentService::class);
                $paymentData = $paymentService->processFranchiseeValidation($targetUser->id, $user->id);

                // Générer un nouveau mot de passe aléatoire
                $newPassword = Str::random(12);

                // Mise à jour du mot de passe ET du statut
                $targetUser->password = bcrypt($newPassword);
                $targetUser->is_active = true;
                $targetUser->save();

                // Envoyer l'email avec le mot de passe ET les infos de paiement
                Mail::to($targetUser->email)->send(new SetPasswordMail(
                    $newPassword,
                    $targetUser->franchisee,
                    true,
                    $paymentData // Ajouter les données de paiement
                ));

                return response()->json([
                    'message' => 'Franchisé validé avec succès. Contrat créé et email envoyé.',
                    'franchisee' => [
                        'id' => $targetUser->id,
                        'first_name' => $targetUser->franchisee->first_name,
                        'last_name' => $targetUser->franchisee->last_name,
                        'email' => $targetUser->email,
                        'is_active' => $targetUser->is_active
                    ],
                    'payment_data' => [
                        'contract_number' => $paymentData['contract']->contract_number,
                        'franchise_fee_amount' => $paymentData['franchise_fee_transaction']->amount,
                        'payment_url' => $paymentData['payment_url'],
                        'due_date' => $paymentData['franchise_fee_transaction']->due_date
                    ]
                ]);

            } else {
                // Simple changement de statut sans création du système de paiement
                $targetUser->is_active = $validated['is_active'];
                $targetUser->save();

                return response()->json([
                    'message' => 'Statut du franchisé mis à jour.',
                    'franchisee' => [
                        'id' => $targetUser->id,
                        'first_name' => $targetUser->franchisee->first_name,
                        'last_name' => $targetUser->franchisee->last_name,
                        'email' => $targetUser->email,
                        'is_active' => $targetUser->is_active
                    ]
                ]);
            }

        } catch (\Exception $e) {
            // Log l'erreur
            Log::error('Erreur validation franchisé: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de la validation du franchisé.',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    // NOUVELLE MÉTHODE : Valider un franchisé
    public function validate($id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $targetUser = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$targetUser || !$targetUser->franchisee) {
            return response()->json(['message' => 'Franchisé non trouvé'], 404);
        }

        if ($targetUser->is_active) {
            return response()->json(['message' => 'Franchisé déjà validé'], 400);
        }

        try {
            // Générer un nouveau mot de passe aléatoire
            $newPassword = Str::random(10);

            // Mise à jour du mot de passe ET du statut
            $targetUser->password = bcrypt($newPassword);
            $targetUser->is_active = true;
            $targetUser->save();

            // Envoyer l'email avec le mot de passe
            Mail::to($targetUser->email)->send(new SetPasswordMail($newPassword, $targetUser->franchisee, true));

            return response()->json([
                'message' => 'Franchisé validé avec succès. Mot de passe envoyé par email.',
                'franchisee' => [
                    'id' => $targetUser->id,
                    'first_name' => $targetUser->franchisee->first_name,
                    'last_name' => $targetUser->franchisee->last_name,
                    'email' => $targetUser->email,
                    'is_active' => $targetUser->is_active
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur validation franchisé: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors de la validation du franchisé.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // NOUVELLE MÉTHODE : Rejeter un franchisé
    public function reject($id)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $targetUser = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$targetUser || !$targetUser->franchisee) {
            return response()->json(['message' => 'Franchisé non trouvé'], 404);
        }

        try {
            DB::beginTransaction();

            // Supprimer le franchisé et l'utilisateur
            $targetUser->franchisee()->delete();
            $targetUser->delete();

            DB::commit();

            return response()->json([
                'message' => 'Franchisé rejeté et supprimé avec succès.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur rejet franchisé: ' . $e->getMessage());

            return response()->json([
                'message' => 'Erreur lors du rejet du franchisé.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getValidated()
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $validated = User::where('role', 'franchisee')
            ->where('is_active', true)
            ->with('franchisee')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
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
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        $unvalidated = User::where('role', 'franchisee')
            ->where('is_active', false)
            ->with('franchisee')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
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
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'superadmin'])) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }

        // Chercher l'utilisateur avec son franchisee par ID utilisateur
        $targetUser = User::where('id', $id)
            ->where('role', 'franchisee')
            ->with('franchisee')
            ->first();

        if (!$targetUser) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        if (!$targetUser->franchisee) {
            return response()->json(['message' => 'Données de franchisé non trouvées'], 404);
        }

        $franchisee = $targetUser->franchisee;

        return response()->json([
            'id' => $targetUser->id,
            'email' => $targetUser->email,
            'is_active' => $targetUser->is_active,
            'first_name' => $franchisee->first_name,
            'last_name' => $franchisee->last_name,
            'phone' => $franchisee->phone,
            'address' => $franchisee->address,
            'zip_code' => $franchisee->zip_code,
            'city' => $franchisee->city,
            'current_situation' => $franchisee->current_situation,
            'desired_zone' => $franchisee->desired_zone,
            'financial_contribution' => $franchisee->financial_contribution,
            'created_at' => $targetUser->created_at,
        ]);
    }


}
