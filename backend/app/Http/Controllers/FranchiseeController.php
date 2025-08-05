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
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
            ]);

            Franchisee::create([
                'user_id' => $user->id,
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
            // Mail::to($user->email)->send(new SetPasswordMail($token));

            DB::commit();

            return response()->json(['message' => 'Demande de franchisé créée. Un email a été envoyé pour définir le mot de passe.'], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Erreur lors de la création du franchisé.'], 500);
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

        // On transforme la collection pour inclure les champs de l'utilisateur au premier niveau
        $transformedFranchisees = $franchisees->map(function ($franchisee) {
            return [
                'id' => $franchisee->id,
                'first_name' => $franchisee->first_name,
                'last_name' => $franchisee->last_name,
                'email' => $franchisee->user->email,
                'is_active' => $franchisee->user->is_active,
                // Ajoute d'autres champs si nécessaire
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

        // Trouve le franchisé avec l’utilisateur associé
        $franchisee = Franchisee::with('user')->find($id);

        if (!$franchisee || !$franchisee->user) {
            return response()->json(['message' => 'Franchisé non trouvé'], 404);
        }

        // Mise à jour du champ is_active dans users
        $franchisee->user->is_active = $validated['is_active'];
        $franchisee->user->save();

        // Retourne les données mises à jour
        return response()->json([
            'message' => 'Statut du franchisé mis à jour.',
            'franchisee' => [
                'id' => $franchisee->id,
                'first_name' => $franchisee->first_name,
                'last_name' => $franchisee->last_name,
                'email' => $franchisee->user->email,
                'is_active' => $franchisee->user->is_active
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
                    'id' => $user->id,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'first_name' => $user->franchisee->first_name ?? null,
                    'last_name' => $user->franchisee->last_name ?? null,
                    'phone' => $user->franchisee->phone ?? null,
                    'city' => $user->franchisee->city ?? null,
                    'zip_code' => $user->franchisee->zip_code ?? null,
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
                    'id' => $user->id,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'first_name' => $user->franchisee->first_name ?? null,
                    'last_name' => $user->franchisee->last_name ?? null,
                    'phone' => $user->franchisee->phone ?? null,
                    'city' => $user->franchisee->city ?? null,
                    'zip_code' => $user->franchisee->zip_code ?? null,
                    'desired_zone' => $user->franchisee->desired_zone ?? null,
                    'financial_contribution' => $user->franchisee->financial_contribution ?? null,
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($unvalidated);
    }

    public function show($id)
    {
        $user = User::where('role', 'franchisee')
            ->where('id', $id)
            ->with('franchisee')
            ->firstOrFail();

        return response()->json([
            'id' => $user->id,
            'email' => $user->email,
            'is_active' => $user->is_active,
            'first_name' => $user->franchisee->first_name ?? null,
            'last_name' => $user->franchisee->last_name ?? null,
            'phone' => $user->franchisee->phone ?? null,
            'address' => $user->franchisee->address ?? null,
            'zip_code' => $user->franchisee->zip_code ?? null,
            'city' => $user->franchisee->city ?? null,
            'current_situation' => $user->franchisee->current_situation ?? null,
            'desired_zone' => $user->franchisee->desired_zone ?? null,
            'financial_contribution' => $user->franchisee->financial_contribution ?? null,
            'created_at' => $user->created_at,
        ]);
    }






}
