<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Crypt;

class MessageSecurityService
{
    /**
     * Condition algorithmique pour déterminer si l'envoi est autorisé
     */
    public static function canSendMessage($sender, $receiver): array
    {
        // Règle 1: Un utilisateur ne peut pas s'envoyer de message à lui-même
        if ($sender->id === $receiver->id) {
            return [
                'allowed' => false,
                'message' => 'Vous ne pouvez pas vous envoyer un message à vous-même.',
                'code' => 'SELF_SEND'
            ];
        }

        // Règle 2: Vérifier que les deux utilisateurs ont des emails valides
        if (!$sender->email || !$receiver->email) {
            return [
                'allowed' => false,
                'message' => 'L\'expéditeur et le destinataire doivent avoir des emails valides.',
                'code' => 'INVALID_EMAIL'
            ];
        }

        // Règle 3: Vérifier que les comptes sont actifs
        if ((isset($sender->is_active) && !$sender->is_active) || 
            (isset($receiver->is_active) && !$receiver->is_active)) {
            return [
                'allowed' => false,
                'message' => 'Un des comptes impliqués est désactivé.',
                'code' => 'INACTIVE_ACCOUNT'
            ];
        }

        // Règle 4: Logique métier basée sur les rôles
        $roleMatrix = self::getRoleExchangeMatrix();
        $senderRole = self::normalizeRole($sender->role ?? 'autre');
        $receiverRole = self::normalizeRole($receiver->role ?? 'autre');

        if (!isset($roleMatrix[$senderRole][$receiverRole])) {
            return [
                'allowed' => false,
                'message' => 'Échange de messages non autorisé entre ces rôles.',
                'code' => 'ROLE_FORBIDDEN'
            ];
        }

        // Règle 5: Vérification du domaine email (local vs externe)
        $senderDomain = substr(strrchr($sender->email, "@"), 1);
        $receiverDomain = substr(strrchr($receiver->email, "@"), 1);
        
        // Si c'est un email local (même domaine), autorisation automatique
        if ($senderDomain === $receiverDomain && self::isLocalDomain($senderDomain)) {
            Log::info('Message local autorisé', [
                'sender' => $sender->email,
                'receiver' => $receiver->email,
                'domain' => $senderDomain
            ]);
        }

        return [
            'allowed' => true,
            'message' => 'Message autorisé.',
            'code' => 'ALLOWED'
        ];
    }

    /**
     * Chiffrement du message pour la sécurité personnelle
     */
    public static function encryptMessage(string $message, $sender, $receiver): string
    {
        try {
            // Créer une clé de chiffrement basée sur les IDs des utilisateurs
            $key = 'msg_' . min($sender->id, $receiver->id) . '_' . max($sender->id, $receiver->id);
            
            // Ajouter un timestamp pour éviter les attaques replay
            $timestamp = now()->timestamp;
            $data = [
                'message' => $message,
                'timestamp' => $timestamp,
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id
            ];
            
            $encrypted = Crypt::encrypt($data);
            
            Log::info('Message chiffré avec succès', [
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id,
                'encrypted_length' => strlen($encrypted)
            ]);
            
            return $encrypted;
        } catch (\Exception $e) {
            Log::error('Erreur lors du chiffrement du message', [
                'error' => $e->getMessage(),
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id
            ]);
            
            // En cas d'erreur, retourner le message en clair avec un marquage
            return '[UNENCRYPTED]' . $message;
        }
    }

    /**
     * Déchiffrement du message
     */
    public static function decryptMessage(string $encryptedMessage, $sender, $receiver): string
    {
        try {
            // Vérifier si le message est marqué comme non chiffré
            if (strpos($encryptedMessage, '[UNENCRYPTED]') === 0) {
                return substr($encryptedMessage, 13); // Retirer le préfixe
            }
            
            $decrypted = Crypt::decrypt($encryptedMessage);
            
            // Vérifier que le message est destiné aux bons utilisateurs
            if (is_array($decrypted) && 
                isset($decrypted['sender_id']) && 
                isset($decrypted['receiver_id'])) {
                
                if (($decrypted['sender_id'] === $sender->id && $decrypted['receiver_id'] === $receiver->id) ||
                    ($decrypted['sender_id'] === $receiver->id && $decrypted['receiver_id'] === $sender->id)) {
                    return $decrypted['message'] ?? $encryptedMessage;
                }
            }
            
            Log::warning('Tentative de déchiffrement non autorisée', [
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id
            ]);
            
            return '[ACCÈS REFUSÉ]';
        } catch (\Exception $e) {
            Log::error('Erreur lors du déchiffrement du message', [
                'error' => $e->getMessage(),
                'sender_id' => $sender->id,
                'receiver_id' => $receiver->id
            ]);
            
            return '[ERREUR DÉCHIFFREMENT]';
        }
    }

    /**
     * Matrice d'échange entre rôles
     */
    private static function getRoleExchangeMatrix(): array
    {
        $roles = ['admin', 'dg', 'sg', 'service_courrier', 'rh', 'drh', 'compta', 'technique', 'circuit', 'autre'];
        $matrix = [];

        foreach ($roles as $senderRole) {
            $matrix[$senderRole] = array_fill_keys($roles, true);
        }

        return $matrix;
    }

    private static function normalizeRole(string $role): string
    {
        return match ($role) {
            'directeur' => 'dg',
            'secretaire' => 'sg',
            'agent' => 'service_courrier',
            'agent_rh' => 'rh',
            default => $role ?: 'autre',
        };
    }

    /**
     * Vérifier si un domaine est considéré comme local
     */
    private static function isLocalDomain(string $domain): bool
    {
        $localDomains = [
            'example.com',
            'localhost',
            'courrier-management.local'
        ];
        
        return in_array(strtolower($domain), $localDomains);
    }

    /**
     * Validation de l'email local
     */
    public static function validateLocalEmail(string $email): array
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'valid' => false,
                'message' => 'Format d\'email invalide.'
            ];
        }

        $domain = substr(strrchr($email, "@"), 1);
        
        if (!self::isLocalDomain($domain)) {
            return [
                'valid' => false,
                'message' => 'Seuls les emails locaux sont autorisés pour la messagerie interne.'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Email local valide.',
            'domain' => $domain
        ];
    }
}
