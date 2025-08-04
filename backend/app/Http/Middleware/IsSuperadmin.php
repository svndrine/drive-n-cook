<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsSuperadmin
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return $next($request);
    }
}

