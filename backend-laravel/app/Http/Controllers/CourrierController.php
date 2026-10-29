<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Models\Courrier;
use App\Models\CourrierAttachment;

class CourrierController extends Controller
{
    /**
     * Liste des courriers visibles par l'utilisateur connecté.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Courrier::query()->with('attachments')->orderByDesc('created_at');

        // Confidentialité : seuls admin/secretaire/directeur voient tout.
        if (!in_array($user->role, ['admin', 'secretaire', 'directeur'])) {
            $query->where(function ($q) use ($user) {
                $email = strtolower($user->email);
                $q->whereRaw('LOWER(expediteur) = ?', [$email])
                  ->orWhereRaw('LOWER(destinataire) = ?', [$email]);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()
        ]);
    }

    /**
     * Création d'un courrier.
     * L'expéditeur est toujours l'utilisateur connecté.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'type'         => ['required', Rule::in(['entrant', 'sortant'])],
            'destinataire' => ['required', 'string', 'max:255'],
            'objet'        => ['required', 'string', 'max:255'],
            'contenu'      => ['nullable', 'string'],
            'priorite'     => ['nullable', Rule::in(['basse', 'normale', 'urgente'])],
            'statut'       => ['nullable', Rule::in(['en_attente', 'traite', 'archive', 'en_cours'])],
            'date_reception' => ['nullable', 'date'],
            'date_envoi'     => ['nullable', 'date'],
        ]);

        $courrier = Courrier::create([
            'reference'      => $this->generateReference($validated['type']),
            'type'           => $validated['type'],
            'expediteur'     => $user->email,
            'destinataire'   => $validated['destinataire'],
            'objet'          => $validated['objet'],
            'contenu'        => $validated['contenu'] ?? null,
            'priorite'       => $validated['priorite'] ?? 'normale',
            'statut'         => $validated['statut'] ?? 'en_attente',
            'date_reception' => $validated['date_reception'] ?? null,
            'date_envoi'     => $validated['date_envoi'] ?? now()->toDateString(),
            'user_id'        => $user->id,
            'service_id'     => $user->service_id ?? 1,
        ]);

        return response()->json([
            'success' => true,
            'data' => $courrier->load('attachments')
        ], 201);
    }

    /**
     * Affichage d'un courrier, avec contrôle d'accès.
     */
    public function show(Request $request, Courrier $courrier)
    {
        $this->authorizeAccess($request->user(), $courrier);

        return response()->json([
            'success' => true,
            'data' => $courrier->load('attachments')
        ]);
    }

    /**
     * Suppression d'un courrier (réservé admin/secretaire/directeur).
     */
    public function destroy(Request $request, Courrier $courrier)
    {
        $user = $request->user();
        if (!in_array($user->role, ['admin', 'secretaire', 'directeur'])) {
            return response()->json(['success' => false, 'message' => 'Accès refusé'], 403);
        }

        $courrier->delete();

        return response()->json(['success' => true]);
    }

    private function authorizeAccess($user, Courrier $courrier)
    {
        if (in_array($user->role, ['admin', 'secretaire', 'directeur'])) {
            return true;
        }

        $email = strtolower($user->email);
        $isAllowed = strtolower($courrier->expediteur) === $email
            || strtolower($courrier->destinataire) === $email;

        abort_unless($isAllowed, 403, 'Accès refusé');
    }

    private function generateReference(string $type): string
    {
        $prefix = $type === 'sortant' ? 'OUT' : 'IN';
        return $prefix . '-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
    }

    /**
     * Upload de pièces jointes pour un courrier.
     */
    public function upload(Request $request, Courrier $courrier)
    {
        $this->authorizeAccess($request->user(), $courrier);

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:5120'], // 5 Mo
        ]);

        $uploadedFile = $validated['file'];
        $path = $uploadedFile->store('courriers', 'public');

        $attachment = CourrierAttachment::create([
            'courrier_id'   => $courrier->id,
            'original_name' => $uploadedFile->getClientOriginalName(),
            'path'          => $path,
            'mime_type'     => $uploadedFile->getClientMimeType(),
            'size'          => $uploadedFile->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'data' => $attachment,
        ], 201);
    }
}
