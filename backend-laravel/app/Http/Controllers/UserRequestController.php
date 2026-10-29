<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserRequestController extends Controller
{
    // Public: création d'une demande
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
                // On interdit seulement les demandes déjà en attente
                Rule::unique('user_requests', 'email')->where(fn($query) => $query->where('status', 'pending')),
            ],
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,secretaire,directeur,agent,compta,rh,dg,sg,service_courrier,drh,technique,circuit,autre',
        ]);

        // Réutilise la demande existante (ex: après un refus) et la remet en attente
        $req = UserRequest::updateOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'status' => 'pending',
                'validated_by' => null,
                'validated_at' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Demande envoyée. En attente de validation.',
            'request' => $req,
        ], 201);
    }

    // Admin: liste des demandes en attente
    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $pending = UserRequest::where('status', 'pending')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $pending,
        ]);
    }

    // Admin: approuver
    public function approve(Request $request, UserRequest $userRequest)
    {
        $this->ensureAdmin($request);

        if ($userRequest->status !== 'pending') {
            return response()->json(['message' => 'Demande déjà traitée'], 409);
        }

        // Créer l'utilisateur s'il n'existe pas déjà
        $user = User::firstOrCreate(
            ['email' => $userRequest->email],
            [
                'name' => $userRequest->name,
                'password' => $userRequest->password,
                'role' => $userRequest->role,
            ]
        );

        $userRequest->update([
            'status' => 'approved',
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Compte validé',
            'user' => $user,
            'request' => $userRequest,
        ]);
    }

    // Admin: refuser
    public function reject(Request $request, UserRequest $userRequest)
    {
        $this->ensureAdmin($request);

        if ($userRequest->status !== 'pending') {
            return response()->json(['message' => 'Demande déjà traitée'], 409);
        }

        $userRequest->update([
            'status' => 'rejected',
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande refusée',
            'request' => $userRequest,
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        if (!$request->user() || $request->user()->role !== 'admin') {
            abort(403, 'Réservé aux administrateurs');
        }
    }
}
