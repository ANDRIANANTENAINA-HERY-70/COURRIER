<?php

namespace App\Http\Controllers;

use App\Models\User;

class UserListController extends Controller
{
    /**
     * Liste complète des utilisateurs avec toutes les informations
     * Utilisé par la page Utilisateurs (admin)
     */
    public function index()
    {
        $users = User::with('service')
            ->select('id', 'name', 'email', 'role', 'photo', 'is_active', 'service_id', 'created_at')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'photo' => $user->photo,
                    'photo_url' => $user->photo ? asset('storage/' . $user->photo) : null,
                    'is_active' => (bool) $user->is_active,
                    'last_login_at' => null, // Column doesn't exist, use null
                    'service' => $user->service ? [
                        'id' => $user->service->id,
                        'name' => $user->service->name
                    ] : null,
                ];
            })
        ]);
    }
}
