<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SecureMessaging
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        
        // Vérifier que l'utilisateur est authentifié
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentification requise pour accéder aux messages.'
            ], 401);
        }

        // Vérifier que l'utilisateur a un email valide
        if (!$user->email || !filter_var($user->email, FILTER_VALIDATE_EMAIL)) {
            return response()->json([
                'success' => false,
                'message' => 'Email invalide. Veuillez configurer votre adresse email.'
            ], 403);
        }

        // Vérifier que le compte est actif
        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Compte désactivé. Accès aux messages refusé.'
            ], 403);
        }

        // Logger l'accès pour audit
        Log::info('Accès sécurisé à la messagerie', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'user_role' => $user->role,
            'ip' => $request->ip(),
            'endpoint' => $request->path(),
            'method' => $request->method()
        ]);

        return $next($request);
    }
}
