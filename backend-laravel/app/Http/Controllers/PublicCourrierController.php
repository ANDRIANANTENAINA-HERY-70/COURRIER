<?php

namespace App\Http\Controllers;

use App\Models\Courrier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PublicCourrierController extends Controller
{
    /**
     * Envoi d'un message (courrier) de l'utilisateur connecté vers un autre user.
     * Supporte maintenant plusieurs fichiers.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'objet' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
            'receiver_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'fichiers' => ['nullable', 'array'],
            'fichiers.*' => ['file', 'max:5120', 'mimes:pdf,doc,docx,png,jpg,jpeg,gif,webp,xls,xlsx,txt'],
            // Support legacy single file upload
            'fichier' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
        ]);

        abort_if((int)$validated['receiver_id'] === (int)$user->id, 422, 'Vous ne pouvez pas vous envoyer un message.');

        $paths = [];
        $primaryPath = null;

        // Traiter les fichiers multiples
        if ($request->hasFile('fichiers')) {
            foreach ($request->file('fichiers') as $file) {
                $path = $file->store('courriers', 'public');
                $paths[] = $path;
                if (!$primaryPath) {
                    $primaryPath = $path;
                }
            }
        } 
        // Support legacy single file upload
        elseif ($request->hasFile('fichier')) {
            $primaryPath = $request->file('fichier')->store('courriers', 'public');
            $paths[] = $primaryPath;
        }

        $courrierData = [
            'objet'       => $validated['objet'],
            'message'     => $validated['message'],
            'sender_id'   => $user->id,
            'receiver_id' => $validated['receiver_id'],
            'fichier_path' => $primaryPath,
        ];

        // Stocker les chemins multiples en JSON si disponibles
        if (!empty($paths)) {
            $courrierData['fichiers_paths'] = json_encode($paths);
        }

        $courrier = Courrier::create($courrierData);

        return response()->json([
            'success' => true,
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ], 201);
    }

    /**
     * Liste des messages reçus pour l'utilisateur connecté.
     * Exclut les courriers en attente programmée qui ne sont pas encore visibles.
     */
    public function inbox(Request $request)
    {
        $courriers = Courrier::query()
            ->where('receiver_id', $request->user()->id)
            // Exclure les courriers en attente dont la date n'est pas encore passée
            ->where(function ($query) {
                $query->whereNull('pending_until')
                    ->orWhere('pending_until', '<=', now());
            })
            ->with(['sender:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courriers,
        ]);
    }

    /**
     * Liste des messages envoyés par l'utilisateur connecté.
     * Exclut les courriers en attente programmée qui ne sont pas encore visibles.
     */
    public function sent(Request $request)
    {
        $courriers = Courrier::query()
            ->where('sender_id', $request->user()->id)
            // Exclure les courriers en attente dont la date n'est pas encore passée
            ->where(function ($query) {
                $query->whereNull('pending_until')
                    ->orWhere('pending_until', '<=', now());
            })
            ->with(['receiver:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courriers,
        ]);
    }

    /**
     * Compatibilité: inbox par email, tout en restant sécurisé (doit correspondre à l'utilisateur connecté).
     */
    public function inboxByEmail(Request $request, string $email)
    {
        abort_unless(
            strtolower($request->user()->email) === strtolower($email),
            403,
            'Accès refusé'
        );

        return $this->inbox($request);
    }

    /**
     * Liste des archives (courriers archivés) pour l'utilisateur connecté.
     */
    public function archives(Request $request)
    {
        $userId = $request->user()->id;

        $courriers = Courrier::query()
            ->where(function ($query) use ($userId) {
                $query->where('receiver_id', $userId)
                    ->whereNotNull('receiver_archived_at');
            })
            ->orWhere(function ($query) use ($userId) {
                $query->where('sender_id', $userId)
                    ->whereNotNull('sender_archived_at');
            })
            ->with(['sender:id,name,email', 'receiver:id,name,email'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $courriers,
        ]);
    }

    /**
     * Archiver un courrier (marquer comme archivé pour l'utilisateur connecté).
     */
    public function archive(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est l'expéditeur ou le destinataire
        abort_unless(
            $courrier->sender_id === $user->id || $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        // Archiver pour l'utilisateur approprié
        if ($courrier->receiver_id === $user->id) {
            $courrier->update(['receiver_archived_at' => now()]);
        } else {
            $courrier->update(['sender_archived_at' => now()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Courrier archivé avec succès',
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ]);
    }

    /**
     * Supprimer définitivement un courrier.
     */
    public function destroy(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est l'expéditeur ou le destinataire
        abort_unless(
            $courrier->sender_id === $user->id || $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        // Supprimer l'archi par user pour éviter les conflits
        if ($courrier->receiver_id === $user->id && !is_null($courrier->receiver_archived_at)) {
            $courrier->update(['receiver_archived_at' => null]);
        } elseif ($courrier->sender_id === $user->id && !is_null($courrier->sender_archived_at)) {
            $courrier->update(['sender_archived_at' => null]);
        } else {
            // Sinon supprimer si pas archivé d'abord
            $courrier->delete();
            return response()->json([
                'success' => true,
                'message' => 'Courrier supprimé avec succès',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Courrier supprimé des archives',
            'data' => $courrier,
        ]);
    }

    /**
     * Marquer un courrier comme lu.
     */
    public function markAsRead(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est le destinataire
        abort_unless(
            $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        $courrier->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Courrier marqué comme lu',
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ]);
    }

    /**
     * Marquer un courrier comme non lu.
     */
    public function markAsUnread(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est le destinataire
        abort_unless(
            $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        $courrier->update(['is_read' => false]);

        return response()->json([
            'success' => true,
            'message' => 'Courrier marqué comme non lu',
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ]);
    }

    /**
     * Mettre un courrier en attente jusqu'à une date/heure spécifiée.
     */
    public function setPending(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        $validated = $request->validate([
            'pending_until' => ['required', 'date_format:Y-m-d H:i:s'],
        ]);

        // Vérifier que l'utilisateur est l'expéditeur ou le destinataire
        abort_unless(
            $courrier->sender_id === $user->id || $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        $courrier->update([
            'pending_until' => $validated['pending_until'],
            'statut' => 'en_attente',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Courrier mis en attente avec succès',
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ]);
    }

    /**
     * Retirer un courrier de l'attente.
     */
    public function removePending(Request $request, Courrier $courrier)
    {
        $user = $request->user();

        // Vérifier que l'utilisateur est l'expéditeur ou le destinataire
        abort_unless(
            $courrier->sender_id === $user->id || $courrier->receiver_id === $user->id,
            403,
            'Non autorisé'
        );

        $courrier->update(['pending_until' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Courrier retiré de l\'attente',
            'data' => $courrier->load('sender:id,name,email', 'receiver:id,name,email'),
        ]);
    }
}
