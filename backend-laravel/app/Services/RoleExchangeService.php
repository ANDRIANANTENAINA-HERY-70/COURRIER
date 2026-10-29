<?php

namespace App\Services;

use App\Models\User;

class RoleExchangeService
{
    /**
     * Vérifie si un échange de message entre deux utilisateurs est autorisé.
     * Tous les rôles sont autorisés à échanger entre eux.
     *
     * @param User $sender - L'utilisateur qui envoie le message
     * @param User $receiver - L'utilisateur qui reçoit le message
     * @return array ['allowed' => bool, 'message' => string]
     */
    public static function canExchange(User $sender, User $receiver): array
    {
        // Auto-envoi interdit
        if ($sender->id === $receiver->id) {
            return [
                'allowed' => false,
                'message' => 'Vous ne pouvez pas vous envoyer un message.'
            ];
        }

        return [
            'allowed' => true,
            'message' => 'Échange autorisé.'
        ];
    }

    /**
     * Ajoute une règle d'échange dans la matrice
     */
    public static function addExchangeRule(string $senderRole, array $receiverRoles): void
    {
        // Conserve la signature pour compatibilité historique.
        // Les règles de rôles ne sont plus appliquées.
    }

    /**
     * Obtient la matrice complète des échanges autorisés
     */
    public static function getExchangeMatrix(): array
    {
        return ['all' => ['all']];
    }

    /**
     * Vérifie si un utilisateur (C) peut voir les messages entre deux autres utilisateurs (A et B)
     * C ne voit les messages que s'il est l'expéditeur ou le destinataire
     *
     * @param User $viewer - L'utilisateur qui cherche à voir les messages
     * @param User $sender - L'expéditeur du message
     * @param User $receiver - Le destinataire du message
     * @return bool
     */
    public static function canViewMessage(User $viewer, User $sender, User $receiver): bool
    {
        // L'utilisateur peut voir le message que s'il est l'expéditeur ou le destinataire
        return $viewer->id === $sender->id || $viewer->id === $receiver->id;
    }
}
