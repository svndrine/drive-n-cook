<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Gestion des requêtes preflight (OPTIONS)
        if ($request->getMethod() === "OPTIONS") {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN')
                ->header('Access-Control-Allow-Credentials', 'false')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Ajouter les headers CORS à toutes les réponses
        return $response
            ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN')
            ->header('Access-Control-Allow-Credentials', 'false');
    }

    /**
     * Détermine l'origine autorisée basée sur la requête
     */
    private function getAllowedOrigin(Request $request): string
    {
        $allowedOrigins = [
            'http://localhost:5173',  // Frontend admin
            'http://127.0.0.1:5173',
            'http://localhost:5174',  // Frontend franchisé
            'http://127.0.0.1:5174',
            'http://localhost:3000',
        ];

        $origin = $request->header('Origin');

        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }

        // Origine par défaut pour le développement
        return 'http://localhost:5173';
    }
}
