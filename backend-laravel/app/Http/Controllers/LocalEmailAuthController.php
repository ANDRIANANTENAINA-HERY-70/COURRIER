<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\MessageSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class LocalEmailAuthController extends Controller
{
    /**
     * Authentification par email local avec validation sécurisée
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6'],
            'remember' => ['nullable', 'boolean']
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données d\'authentification invalides.',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        try {
            // Étape 1: Valider que l'email est local
            $emailValidation = MessageSecurityService::validateLocalEmail($credentials['email']);
            if (!$emailValidation['valid']) {
                Log::warning('Tentative de connexion avec email non local', [
                    'email' => $credentials['email'],
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $emailValidation['message'],
                    'code' => 'INVALID_DOMAIN'
                ], 403);
            }

            // Étape 2: Vérifier que l'utilisateur existe
            $user = User::where('email', $credentials['email'])->first();
            if (!$user) {
                Log::warning('Tentative de connexion avec email inexistant', [
                    'email' => $credentials['email'],
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect.',
                    'code' => 'INVALID_CREDENTIALS'
                ], 401);
            }

            // Étape 3: Vérifier que le compte est actif
            if (isset($user->is_active) && !$user->is_active) {
                Log::warning('Tentative de connexion sur compte désactivé', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé. Contactez l\'administrateur.',
                    'code' => 'ACCOUNT_DISABLED'
                ], 403);
            }

            // Étape 4: Tenter l'authentification
            if (!Auth::attempt($credentials, $request->boolean('remember'))) {
                Log::warning('Échec d\'authentification', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'ip' => $request->ip(),
                    'reason' => 'invalid_password'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Email ou mot de passe incorrect.',
                    'code' => 'INVALID_CREDENTIALS'
                ], 401);
            }

            // Étape 5: Générer le token d'accès
            $token = $user->createToken('secure_messaging_token')->plainTextToken;

            // Étape 6: Journaliser la connexion réussie
            Log::info('Connexion réussie', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'user_role' => $user->role,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'remember' => $request->boolean('remember')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Authentification réussie.',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                        'is_active' => $user->is_active ?? true,
                        'email_verified' => !is_null($user->email_verified_at),
                        'local_domain' => $emailValidation['domain'] ?? null
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                    'expires_in' => config('sanctum.expiration', 525600) // minutes
                ],
                'security_info' => [
                    'authenticated' => true,
                    'email_verified' => true,
                    'local_domain' => true,
                    'session_secure' => true
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'authentification', [
                'error' => $e->getMessage(),
                'email' => $credentials['email'],
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur technique lors de l\'authentification.',
                'code' => 'TECHNICAL_ERROR'
            ], 500);
        }
    }

    /**
     * Déconnexion sécurisée
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Révoquer tous les tokens de l'utilisateur
            $user->tokens()->delete();

            Log::info('Déconnexion réussie', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie.',
                'security_info' => [
                    'all_tokens_revoked' => true,
                    'session_terminated' => true
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la déconnexion', [
                'error' => $e->getMessage(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion.',
                'code' => 'LOGOUT_ERROR'
            ], 500);
        }
    }

    /**
     * Vérifier le statut d'authentification
     */
    public function checkAuth(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
                'authenticated' => false
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur authentifié.',
            'authenticated' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active ?? true,
                    'email_verified' => !is_null($user->email_verified_at)
                ],
                'session_info' => [
                    'token_valid' => true,
                    'last_activity' => now(),
                    'permissions' => $this->getUserPermissions($user)
                ]
            ]
        ]);
    }

    /**
     * Rafraîchir le token d'authentification
     */
    public function refreshToken(Request $request)
    {
        $user = $request->user();

        try {
            // Révoquer l'ancien token
            $user->currentAccessToken()->delete();

            // Générer un nouveau token
            $newToken = $user->createToken('refreshed_secure_token')->plainTextToken;

            Log::info('Token rafraîchi', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Token rafraîchi avec succès.',
                'data' => [
                    'token' => $newToken,
                    'token_type' => 'Bearer',
                    'expires_in' => config('sanctum.expiration', 525600)
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors du rafraîchissement du token', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du rafraîchissement du token.',
                'code' => 'REFRESH_ERROR'
            ], 500);
        }
    }

    /**
     * Obtenir les permissions de l'utilisateur
     */
    private function getUserPermissions($user): array
    {
        $permissions = [
            'can_send_messages' => true,
            'can_receive_messages' => true,
            'can_view_inbox' => true,
            'can_view_sent' => true
        ];

        // Permissions basées sur le rôle
        switch ($this->normalizeRole($user->role)) {
            case 'admin':
                $permissions['can_delete_all_messages'] = true;
                $permissions['can_view_all_messages'] = true;
                $permissions['can_manage_users'] = true;
                break;
            case 'sg':
                $permissions['can_delete_own_messages'] = true;
                $permissions['can_archive_messages'] = true;
                break;
            case 'dg':
                $permissions['can_delete_own_messages'] = true;
                $permissions['can_archive_messages'] = true;
                $permissions['can_view_team_messages'] = true;
                break;
            case 'rh':
            case 'drh':
                $permissions['can_send_hr_messages'] = true;
                $permissions['can_receive_hr_requests'] = true;
                break;
            default:
                $permissions['can_delete_own_messages'] = true;
                break;
        }

        return $permissions;
    }

    private function normalizeRole(?string $role): string
    {
        return match ($role) {
            'secretaire' => 'sg',
            'directeur' => 'dg',
            'agent' => 'service_courrier',
            'agent_rh' => 'rh',
            default => $role ?: 'autre',
        };
    }

    /**
     * Valider le format de l'email local
     */
    public function validateLocalEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email']
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Format d\'email invalide.',
                'errors' => $validator->errors()
            ], 422);
        }

        $email = $request->input('email');
        $validation = MessageSecurityService::validateLocalEmail($email);

        return response()->json([
            'success' => $validation['valid'],
            'message' => $validation['message'],
            'data' => [
                'email' => $email,
                'domain' => $validation['domain'] ?? null,
                'is_local' => $validation['valid']
            ]
        ]);
    }
}
