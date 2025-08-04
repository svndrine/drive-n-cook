<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Franchisee;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;


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
                'firstname' => $validatedData['first_name'],
                'lastname' => $validatedData['last_name'],
                'is_active' => false
            ]);



            $franchisee = new Franchisee([
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

            $user->franchisee()->save($franchisee);

            // Notification au superadmin
            Mail::raw("Un nouveau franchisé s'est inscrit : {$validatedData['first_name']} {$validatedData['last_name']} ({$validatedData['email']})", function ($message) {
                $message->to('superadmin@drivencook.com') // Email du superadmin
                ->subject('Nouvelle demande de franchisé sur Drive\'N Cook');
            });


            // Envoi du mot de passe par mail
            Mail::raw("Bonjour {$validatedData['first_name']}, voici votre mot de passe temporaire : $randomPassword", function ($message) use ($validatedData) {
                $message->to($validatedData['email'])
                    ->subject("Accès à votre espace franchisé Drive'N Cook");
            });

            // Création du token de réinitialisation
            $token = Str::random(60);

            DB::table('password_reset_tokens')->insert([
                'email' => $validatedData['email'],
                'token' => $token,
                'created_at' => Carbon::now(),
            ]);

            $url = "http://localhost:3000/create-password?token=$token"; // Frontend à adapter


            // Envoi du lien de mot de passe par mail
            Mail::raw("Bonjour {$validatedData['first_name']}, cliquez ici pour définir votre mot de passe : $url", function ($message) use ($validatedData) {
                $message->to($validatedData['email'])
                    ->subject("Créez votre mot de passe Drive'N Cook");
            });



            DB::commit();

            return response()->json(['message' => 'Franchisee created and password sent by email'], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error', 'error' => $e->getMessage()], 500);
        }


    }
}
