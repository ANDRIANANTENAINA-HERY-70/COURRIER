<?php

namespace App\Http\Controllers;

use App\Models\Courrier;
use App\Models\User;
use App\Services\MessageSecurityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class SecureMessageController extends Controller
{
    /**
     * Envoyer un message sécurisé avec conditions algorithmiques
     */
    public function sendMessage(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'receiver_email' => ['required', 'email'],
            'objet' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:10000'],
            'priority' => ['nullable', 'in:basse,normale,urgente'],
            'fichier' => ['nullable', 'file', 'max:5120', 'mimes:pdf,doc,docx,png,jpg,jpeg'],
            'require_read_receipt' => ['nullable', 'boolean'],
        ]);

        try {
            // Étape 1: Valider l'email du destinataire
            $emailValidation = MessageSecurityService::validateLocalEmail($validated['receiver_email']);
            if (!$emailValidation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => $emailValidation['message'],
                    'code' => 'INVALID_EMAIL'
                ], 422);
            }

            // Étape 2: Trouver le destinataire
            $receiver = User::where('email', $validated['receiver_email'])->first();
            if (!$receiver) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destinataire introuvable dans le système.',
                    'code' => 'RECEIVER_NOT_FOUND'
                ], 404);
            }

            // Étape 3: Appliquer la condition algorithmique de sécurité
            $securityCheck = MessageSecurityService::canSendMessage($user, $receiver);
            if (!$securityCheck['allowed']) {
                Log::warning('Tentative d\'envoi non autorisée', [
                    'sender_id' => $user->id,
                    'sender_email' => $user->email,
                    'receiver_id' => $receiver->id,
                    'receiver_email' => $receiver->email,
                    'reason' => $securityCheck['code']
                ]);

                return response()->json([
                    'success' => false,
                    'message' => $securityCheck['message'],
                    'code' => $securityCheck['code']
                ], 403);
            }

            // Étape 4: Chiffrer le message pour la sécurité personnelle
            $encryptedMessage = MessageSecurityService::encryptMessage(
                $validated['message'],
                $user,
                $receiver
            );

            $filePath = null;
            $originalName = null;
            if ($request->hasFile('fichier')) {
                $file = $request->file('fichier');
                $originalName = $file->getClientOriginalName();
                $filePath = $file->storeAs(
                    'secure_messages',
                    $this->buildStoredFileName($originalName, 'secure'),
                    'private'
                );
            }

            // Étape 5: Créer le message dans la base de données
            $courrierData = [
                'sender_id' => $user->id,
                'receiver_id' => $receiver->id,
                'objet' => $validated['objet'],
                'message' => $encryptedMessage,
                'type' => 'sortant',
                'priorite' => $validated['priority'] ?? 'normale',
                'statut' => 'en_attente',
                'fichier_path' => $filePath,
                'is_encrypted' => true,
                'require_read_receipt' => $validated['require_read_receipt'] ?? false,
            ];

            if ($originalName !== null && Schema::hasColumn('courriers', 'fichier_original_name')) {
                $courrierData['fichier_original_name'] = $originalName;
            }

            $courrier = Courrier::create($courrierData);

            // Étape 7: Journaliser l'envoi réussi
            Log::info('Message sécurisé envoyé avec succès', [
                'courrier_id' => $courrier->id,
                'sender_id' => $user->id,
                'sender_email' => $user->email,
                'receiver_id' => $receiver->id,
                'receiver_email' => $receiver->email,
                'objet' => $validated['objet'],
                'encrypted' => true,
                'has_attachment' => !is_null($filePath)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Message sécurisé envoyé avec succès.',
                'data' => [
                    'id' => $courrier->id,
                    'objet' => $courrier->objet,
                    'receiver' => [
                        'id' => $receiver->id,
                        'name' => $receiver->name,
                        'email' => $receiver->email
                    ],
                    'sent_at' => $courrier->created_at,
                    'encrypted' => true,
                    'security_level' => 'high'
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Erreur lors de l\'envoi du message sécurisé', [
                'error' => $e->getMessage(),
                'sender_id' => $user->id,
                'receiver_email' => $validated['receiver_email'] ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur technique lors de l\'envoi du message.',
            'code' => 'TECHNICAL_ERROR'
        ], 500);
        }
    }

    private function buildStoredFileName(string $originalName, string $prefix = 'courrier'): string
    {
        $baseName = pathinfo($originalName, PATHINFO_FILENAME);
        $extension = pathinfo($originalName, PATHINFO_EXTENSION);
        $safeBaseName = Str::slug($baseName) ?: $prefix;
        $uniqueSuffix = now()->format('YmdHis') . '-' . Str::upper(Str::random(8));

        return $safeBaseName . '-' . $uniqueSuffix . ($extension ? '.' . $extension : '');
    }

    /**
     * Recevoir les messages avec déchiffrement conditionnel
     */
    public function getInbox(Request $request)
    {
        $user = $request->user();

        try {
            $messages = Courrier::where('receiver_id', $user->id)
                ->with(['sender:id,name,email,role'])
                ->whereNull('receiver_deleted_at')
                ->orderByDesc('created_at')
                ->get();

            $decryptedMessages = $messages->map(function ($message) use ($user) {
                $messageArray = $message->toArray();
                
                // Déchiffrer le message si nécessaire
                if ($message->is_encrypted && $message->message) {
                    $messageArray['message'] = MessageSecurityService::decryptMessage(
                        $message->message,
                        $message->sender,
                        $user
                    );
                } else {
                    $messageArray['message'] = $message->message;
                }

                // Ajouter des métadonnées de sécurité
                $messageArray['security_info'] = [
                    'encrypted' => $message->is_encrypted ?? false,
                    'sender_verified' => true,
                    'delivery_confirmed' => true,
                    'read_receipt_required' => $message->require_read_receipt ?? false
                ];

                return $messageArray;
            });

            Log::info('Boîte de réception sécurisée chargée', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'messages_count' => $messages->count(),
                'encrypted_messages' => $messages->where('is_encrypted', true)->count()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Messages reçus chargés avec succès.',
                'data' => $decryptedMessages,
                'security_info' => [
                    'total_messages' => $messages->count(),
                    'encrypted_messages' => $messages->where('is_encrypted', true)->count(),
                    'user_verified' => true
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement de la boîte de réception', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des messages.',
                'code' => 'LOAD_ERROR'
            ], 500);
        }
    }

    /**
     * Obtenir les messages envoyés avec déchiffrement
     */
    public function getSent(Request $request)
    {
        $user = $request->user();

        try {
            $messages = Courrier::where('sender_id', $user->id)
                ->with(['receiver:id,name,email,role'])
                ->whereNull('sender_deleted_at')
                ->orderByDesc('created_at')
                ->get();

            $decryptedMessages = $messages->map(function ($message) use ($user) {
                $messageArray = $message->toArray();
                
                // Déchiffrer le message si nécessaire
                if ($message->is_encrypted && $message->message) {
                    $messageArray['message'] = MessageSecurityService::decryptMessage(
                        $message->message,
                        $user,
                        $message->receiver
                    );
                } else {
                    $messageArray['message'] = $message->message;
                }

                // Ajouter des métadonnées de sécurité
                $messageArray['security_info'] = [
                    'encrypted' => $message->is_encrypted ?? false,
                    'delivery_status' => $this->getDeliveryStatus($message),
                    'read_receipt_required' => $message->require_read_receipt ?? false
                ];

                return $messageArray;
            });

            return response()->json([
                'success' => true,
                'message' => 'Messages envoyés chargés avec succès.',
                'data' => $decryptedMessages,
                'security_info' => [
                    'total_messages' => $messages->count(),
                    'encrypted_messages' => $messages->where('is_encrypted', true)->count()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors du chargement des messages envoyés', [
                'error' => $e->getMessage(),
                'user_id' => $user->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des messages.',
                'code' => 'LOAD_ERROR'
            ], 500);
        }
    }

    /**
     * Obtenir le statut de livraison d'un message
     */
    private function getDeliveryStatus($message): string
    {
        if ($message->receiver_deleted_at) {
            return 'deleted_by_receiver';
        }
        
        if ($message->receiver_archived_at) {
            return 'archived_by_receiver';
        }
        
        return 'delivered';
    }

    /**
     * Marquer un message comme lu avec confirmation sécurisée
     */
    public function markAsRead(Request $request, $id)
    {
        $user = $request->user();

        $message = Courrier::where('id', $id)
            ->where('receiver_id', $user->id)
            ->first();

        if (!$message) {
            return response()->json([
                'success' => false,
                'message' => 'Message introuvable ou accès non autorisé.'
            ], 404);
        }

        // Marquer comme lu
        $message->update([
            'read_at' => now(),
            'statut' => 'lu'
        ]);

        Log::info('Message marqué comme lu', [
            'message_id' => $message->id,
            'user_id' => $user->id,
            'read_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message marqué comme lu.',
            'data' => [
                'read_at' => $message->read_at,
                'security_verified' => true
            ]
        ]);
    }
}
