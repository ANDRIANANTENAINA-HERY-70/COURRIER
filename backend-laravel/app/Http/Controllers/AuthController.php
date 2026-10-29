<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRequest;
use App\Models\PasswordResetRequest;
use App\Notifications\AdminPasswordResetNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'name'),
                Rule::unique('user_requests', 'name')->where(fn($q) => $q->where('status', 'pending')),
            ],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where(fn($q) => $q->whereNotNull('email')),
                Rule::unique('user_requests', 'email')->where(fn($q) => $q->where('status', 'pending')->whereNotNull('email')),
            ],
            'matricule' => [
                'required',
                'string',
                'size:6',
                'regex:/^[0-9]{6}$/',
                Rule::unique('users', 'matricule'),
            ],
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,secretaire,directeur,agent,compta,rh,dg,sg,service_courrier,drh,technique,circuit,autre'
        ]);

        $requestModel = UserRequest::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'matricule' => $validated['matricule'] ?? null,
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => 'pending',
                'validated_by' => null,
                'validated_at' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Demande envoyée. Un administrateur doit valider le compte avant utilisation.',
            'request' => $requestModel,
        ], 202);
    }

    /**
     * Inscription directe (compte actif immédiatement).
     * Bloque si l'email existe déjà.
     */
    public function signup(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'name'),
            ],
            'email' => [
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->where(fn($q) => $q->whereNotNull('email')),
            ],
            'matricule' => [
                'required',
                'string',
                'size:6',
                'regex:/^[0-9]{6}$/',
                Rule::unique('users', 'matricule'),
            ],
            'password' => 'required|string|min:8',
            'role' => 'nullable|in:admin,secretaire,directeur,agent,compta,rh,dg,sg,service_courrier,drh,technique,circuit,autre',
        ]);

        $role = $validated['role'] ?? 'agent';

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'matricule' => $validated['matricule'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $role,
            'service_id' => 1,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Compte créé et connecté.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required'
        ]);

        // Determine if the input is email or matricule
        $field = filter_var($request->email, FILTER_VALIDATE_EMAIL) ? 'email' : 'matricule';

        $user = User::where($field, $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les informations d\'identification sont incorrectes.']
            ]);
        }

        // Check if the account is active
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Votre compte est désactivé. Veuillez contacter un administrateur.']
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => $user,
            'token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Déconnexion réussie'
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user()->load('service');
        $user->photo_url = $user->photo ? asset('storage/' . $user->photo) : null;

        return response()->json([
            'success' => true,
            'user' => $user
        ]);
    }

    /**
     * Mettre à jour le profil de l'utilisateur (nom, email, etc.)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => [
                'sometimes',
                'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'matricule' => [
                'sometimes',
                'nullable',
                'string',
                'size:6',
                'regex:/^[0-9]{6}$/',
                Rule::unique('users', 'matricule')->ignore($user->id),
            ],
        ]);

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (array_key_exists('email', $validated)) {
            $user->email = $validated['email'];
        }
        if (array_key_exists('matricule', $validated)) {
            $user->matricule = $validated['matricule'];
        }

        $user->save();
        $user = $user->load('service');
        $user->photo_url = $user->photo ? asset('storage/' . $user->photo) : null;

        return response()->json([
            'success' => true,
            'message' => 'Profil mis à jour avec succès',
            'user' => $user
        ]);
    }

    /**
     * Télécharger et mettre à jour l'avatar de l'utilisateur
     */
    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'avatar' => 'required|image|max:5120', // max 5MB
        ]);

        if ($request->hasFile('avatar')) {
            $file = $request->file('avatar');

            // Créer le dossier s'il n'existe pas
            $avatarPath = storage_path('app/public/avatars');
            if (!file_exists($avatarPath)) {
                mkdir($avatarPath, 0755, true);
            }

            // Supprimer l'ancien avatar s'il existe
            if ($user->photo && file_exists(storage_path('app/public/' . $user->photo))) {
                unlink(storage_path('app/public/' . $user->photo));
            }

            // Sauvegarder le nouvel avatar
            $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $file->storeAs('public/avatars', $filename);

            $user->photo = 'avatars/' . $filename;
            $user->save();

            // Retourner l'URL de l'avatar
            $avatarUrl = asset('storage/avatars/' . $filename);
            $user = $user->load('service');
            $user->photo_url = $avatarUrl;

            return response()->json([
                'success' => true,
                'message' => 'Avatar téléchargé avec succès',
                'photo' => $user->photo,
                'photo_url' => $avatarUrl,
                'user' => $user
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Aucun fichier fourni'
        ], 400);
    }

    /**
     * Supprimer l'avatar de l'utilisateur
     */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();

        if ($user->photo && file_exists(storage_path('app/public/' . $user->photo))) {
            unlink(storage_path('app/public/' . $user->photo));
        }

        $user->photo = null;
        $user->save();
        $user = $user->load('service');
        $user->photo_url = null;

        return response()->json([
            'success' => true,
            'message' => 'Avatar supprimé avec succès',
            'user' => $user
        ]);
    }

    /**
     * Demande de réinitialisation de mot de passe
     * Génère un code et notifie les administrateurs
     * Accepte soit l'email, soit le matricule
     */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
        ]);

        $identifier = $validated['email'];

        // Determine if the input is email or matricule
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'matricule';

        $user = User::where($field, $identifier)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun utilisateur trouvé avec cet identifiant.',
            ], 404);
        }

        $email = $user->email;

        // Supprimer les anciennes demandes non utilisées pour cet email
        PasswordResetRequest::where('email', $email)
            ->whereNull('used_at')
            ->delete();

        // Générer un code à 6 chiffres
        $code = (string) random_int(100000, 999999);

        // Créer la demande de réinitialisation
        $resetRequest = PasswordResetRequest::create([
            'user_id' => $user->id,
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15),
        ]);

        // Notifier les administrateurs actifs
        $activeAdmins = User::where('role', 'admin')
            ->where('is_active', true)
            ->get();

        foreach ($activeAdmins as $admin) {
            $admin->notify(new AdminPasswordResetNotification($resetRequest));
        }

        return response()->json([
            'success' => true,
            'message' => 'Votre demande a été envoyée aux administrateurs. Un code de réinitialisation a été généré.',
        ]);
    }

    /**
     * Vérification du code de réinitialisation
     * Accepte soit l'email, soit le matricule
     */
    public function verifyResetCode(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $identifier = $validated['email'];
        $code = $validated['code'];

        // Determine if the input is email or matricule
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'matricule';

        // Find the user by email or matricule
        $user = User::where($field, $identifier)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Code invalide ou expiré.',
            ], 422);
        }

        $email = $user->email;

        $resetRequest = PasswordResetRequest::query()
            ->where('email', $email)
            ->where('code', $code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Code invalide ou expiré.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Code validé avec succès.',
            'email' => $email,
        ]);
    }

    /**
     * Réinitialisation du mot de passe
     * Accepte soit l'email, soit le matricule
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $identifier = $validated['email'];
        $code = $validated['code'];

        // Determine if the input is email or matricule
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'matricule';

        // Find the user by email or matricule
        $user = User::where($field, $identifier)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé.',
            ], 404);
        }

        $email = $user->email;

        $resetRequest = PasswordResetRequest::query()
            ->where('email', $email)
            ->where('code', $code)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$resetRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Code invalide ou expiré.',
            ], 422);
        }

        // Réinitialiser le mot de passe
        $user->password = Hash::make($validated['password']);
        $user->save();

        // Marquer la demande comme utilisée
        $resetRequest->used_at = now();
        $resetRequest->save();

        // Invalider tous les tokens de l'utilisateur
        $user->tokens()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mot de passe réinitialisé avec succès.',
        ]);
    }

    /**
     * Toggle user active/inactive status (Admin only)
     */
    public function toggleUserStatus(Request $request, $userId)
    {
        // Check authorization - only admins can toggle status
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $user = User::findOrFail($userId);

        // Don't allow deactivating the last admin
        if (
            $user->role === 'admin' && $user->is_active &&
            User::where('role', 'admin')->where('is_active', true)->count() === 1
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de désactiver le dernier administrateur'
            ], 400);
        }

        $user->is_active = !$user->is_active;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur ' . ($user->is_active ? 'activé' : 'désactivé') . ' avec succès',
            'user' => $user
        ]);
    }

    /**
     * Delete a user from the database (Admin only)
     */
    public function deleteUser(Request $request, $userId)
    {
        // Check authorization - only admins can delete
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $user = User::findOrFail($userId);

        // Prevent deleting the last admin
        if ($user->role === 'admin' && User::where('role', 'admin')->count() === 1) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer le dernier administrateur'
            ], 400);
        }

        // Prevent admin from deleting their own account
        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas supprimer votre propre compte'
            ], 400);
        }

        $email = $user->email;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Utilisateur supprimé avec succès',
            'deleted_user_email' => $email
        ]);
    }

    /**
     * Get reset password code for a user (Admin only)
     */
    public function getUserResetCode(Request $request, $userId)
    {
        // Check authorization - only admins can view reset codes
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $user = User::findOrFail($userId);

        // Get the latest password reset request
        $resetRequest = PasswordResetRequest::where('email', $user->email)
            ->whereNull('used_at')
            ->latest('created_at')
            ->first();

        if (!$resetRequest) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun code de réinitialisation en cours pour cet utilisateur',
                'code' => null
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Code de réinitialisation récupéré',
            'code' => $resetRequest->code,
            'user_email' => $user->email,
            'expires_at' => $resetRequest->expires_at
        ]);
    }

    /**
     * Change user role (Admin only)
     */
    public function changeUserRole(Request $request, $userId)
    {
        // Check authorization - only admins can change roles
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Validate request
        $request->validate([
            'role' => 'required|string|in:admin,secretaire,directeur,agent,compta,rh,dg,sg,service_courrier,drh,technique,circuit,autre'
        ]);

        $user = User::findOrFail($userId);
        $newRole = $request->input('role');

        // Prevent changing the last admin's role
        if ($user->role === 'admin' && User::where('role', 'admin')->count() === 1) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de changer le rôle du dernier administrateur'
            ], 400);
        }

        // Prevent admin from changing their own role to non-admin
        if ($request->user()->id === $user->id && $newRole !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas changer votre propre rôle'
            ], 400);
        }

        $oldRole = $user->role;
        $user->role = $newRole;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Rôle changé avec succès de '$oldRole' à '$newRole'",
            'user' => $user
        ]);
    }

    /**
     * Check if a name is available for registration
     */
    public function checkNameAvailability(Request $request)
    {
        $request->validate([
            'name' => 'required|string'
        ]);

        $name = $request->input('name');

        $existsInUsers = User::where('name', $name)->exists();
        $existsInRequests = UserRequest::where('name', $name)
            ->where('status', 'pending')
            ->exists();

        $available = !$existsInUsers && !$existsInRequests;

        return response()->json([
            'available' => $available,
            'message' => $available ? 'Ce nom est disponible' : 'Ce nom est déjà utilisé'
        ]);
    }
}
