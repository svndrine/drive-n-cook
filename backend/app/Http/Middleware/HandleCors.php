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

        // LOG DE DÉBOGAGE COMPLET
        \Log::info('=== CORS DEBUG ===', [
            'method' => $request->getMethod(),
            'url' => $request->fullUrl(),
            'origin' => $request->header('Origin'),
            'referer' => $request->header('Referer'),
            'user_agent' => substr($request->header('User-Agent'), 0, 100),
            'headers' => $request->headers->all()
        ]);


        // Gestion des requêtes preflight (OPTIONS)
        if ($request->getMethod() === "OPTIONS") {
            \Log::info('=== PREFLIGHT RESPONSE ===');
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN')
                ->header('Access-Control-Allow-Credentials', 'false')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        \Log::info('=== ACTUAL RESPONSE ===', [
            'status' => $response->getStatusCode()
        ]);

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
            // Environnement de développement local
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:3000',

            // Environnement de production
            'http://193.70.0.27:5173',  // Frontend admin en production
            'http://193.70.0.27:5174',  // Frontend franchise en production

            // Si vous avez un nom de domaine
            // 'https://admin.drivncook.com',
            // 'https://franchise.drivncook.com',
        ];

        $origin = $request->header('Origin');

        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }

        // Pour le développement, autoriser toutes les origines localhost/127.0.0.1
        if ($origin && (
                str_starts_with($origin, 'http://localhost:') ||
                str_starts_with($origin, 'http://127.0.0.1:') ||
                str_starts_with($origin, 'http://193.70.0.27:')
            )) {
            return $origin;
        }

        // Origine par défaut basée sur l'environnement
        return app()->environment('production')
            ? 'http://193.70.0.27:5173'
            : 'http://localhost:5173';
    }
}
