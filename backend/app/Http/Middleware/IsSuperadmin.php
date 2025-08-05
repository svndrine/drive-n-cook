<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsSuperadmin
{
    /**
     * Gère une requête entrante.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Vérifie si l'utilisateur est authentifié et si son rôle est 'superadmin'
        if ($request->user() && $request->user()->role === 'superadmin') {
            return $next($request);
        }

        // Si l'utilisateur n'est pas un superadmin, retourne une erreur d'accès interdit
        return response()->json(['message' => 'Accès interdit (superadmin uniquement)'], 403);
    }
}
