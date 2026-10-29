# Logique des Échanges de Rôles - Système de Courriers

## Vue d'ensemble

Le système de gestion des courriers utilise une logique stricte de contrôle d'accès basée sur les rôles des utilisateurs. Cette logique garantit que :

1. **L'expéditeur** voit UNIQUEMENT les courriers qu'il a envoyés
2. **Le destinataire** voit UNIQUEMENT les courriers reçus
3. **Les tiers (C)** ne voient AUCUN courrier s'ils ne sont pas impliqués

## Exemple Pratique

### Scénario: A envoie à B, C est tiers

```
Utilisateur A (Rôle: Directeur)
├─ Envoie un courrier à B
└─ Résultat:
   ├─ A voit dans "Courriers sortants" ✅
   ├─ B voit dans "Courriers entrants" ✅
   └─ C ne voit rien ❌

Utilisateur B (Rôle: Secrétaire)
├─ Reçoit le courrier
└─ Voit dans "Courriers entrants"

Utilisateur C (Rôle: Agent)
├─ N'intervient pas
└─ Non affecté par l'échange
```

## Matrice d'Autorisation des Échanges

| Rôle Expéditeur | Peut Envoyer À                      |
| --------------- | ----------------------------------- |
| **admin**       | admin, directeur, secrétaire, agent |
| **directeur**   | admin, directeur, secrétaire, agent |
| **secrétaire**  | admin, directeur, secrétaire, agent |
| **agent**       | admin, directeur, secrétaire, agent |

> ⚠️ Important: Un utilisateur **NE PEUT JAMAIS** s'envoyer un message à lui-même.

## Implémentation Technique

### 1. Service de Validation (`RoleExchangeService`)

Gère la validation des échanges entre rôles.

**Méthode principale:**

```php
RoleExchangeService::canExchange(User $sender, User $receiver): array
```

**Retour:**

```php
[
    'allowed' => true|false,
    'message' => 'Description du résultat'
]
```

### 2. Contrôleur (`PublicCourrierController`)

#### `store()` - Envoi d'un courrier

- ✅ Valide que le sender et receiver existent
- ✅ Valide les rôles via `RoleExchangeService::canExchange()`
- ✅ Création du courrier en base de données
- ✅ Log de l'opération avec détails des rôles

#### `inbox()` - Courriers entrants

- 🔒 Filtre: `WHERE receiver_id = authenticated_user_id`
- ✅ Seul le destinataire voit les courriers
- ✅ Inclut: sender, email, role

#### `sent()` - Courriers sortants

- 🔒 Filtre: `WHERE sender_id = authenticated_user_id`
- ✅ Seul l'expéditeur voit les courriers
- ✅ Inclut: receiver, email, role

## Flux d'Envoi d'un Courrier

```
1. Utilisateur A clique "Envoyer"
   ↓
2. Validation du formulaire (objet, message, receiver_id)
   ↓
3. Vérification: user != receiver ✓
   ↓
4. Récupération de l'utilisateur B par ID
   ↓
5. Validation des rôles: RoleExchangeService::canExchange(A, B)
   │
   ├─ SI REFUSÉ ❌
   │  └─ Réponse 422: Message d'erreur
   │
   └─ SI AUTORISÉ ✅
      ↓
6. Création du courrier en base de données
   (sender_id=A.id, receiver_id=B.id)
   ↓
7. Stockage fichier si fourni
   ↓
8. Log avec détails: IDs, emails, rôles
   ↓
9. Réponse 201: Succès
```

## Logging & Traçabilité

Chaque opération est enregistrée avec:

### Envoi de courrier

```php
'courrier_id'    => ID du courrier créé
'sender_id'      => ID de A
'sender_email'   => Email de A
'sender_role'    => Rôle de A
'receiver_id'    => ID de B
'receiver_email' => Email de B
'receiver_role'  => Rôle de B
'objet'          => Objet du courrier
```

### Lecture des courriers

```php
'user_id'        => ID de l'utilisateur lisant
'user_email'     => Email de l'utilisateur
'user_role'      => Rôle de l'utilisateur
'courriers_count'=> Nombre de courriers
```

## Configuration des Rôles

Pour modifier les règles d'échange, éditez `app/Services/RoleExchangeService.php`:

```php
protected static $exchangeMatrix = [
    'admin' => ['admin', 'directeur', 'secrétaire', 'agent'],
    'directeur' => ['admin', 'directeur', 'secrétaire', 'agent'],
    // ...
];
```

## Gestion des Erreurs

| Code | Message                                     | Cause                         |
| ---- | ------------------------------------------- | ----------------------------- |
| 401  | Non authentifié                             | Token manquant/invalide       |
| 403  | Accès refusé                                | Email ne correspond pas       |
| 422  | Vous ne pouvez pas vous envoyer un message  | sender_id === receiver_id     |
| 422  | Un 'directeur' ne peut pas envoyer à un 'X' | Rôle non autorisé             |
| 422  | Destinataire invalide ou sans email         | User non trouvé ou email null |

## Recommandations de Sécurité

✅ **À faire:**

- Valider les rôles côté serveur (jamais faire confiance au client)
- Logger tous les échanges pour audit
- Vérifier les permissions à chaque requête
- Utiliser des IDs utilisateur stricts
- Utiliser HTTPS en production

❌ **À éviter:**

- Exposer les rôles au frontend sans validation serveur
- Permettre le filtrage côté client
- Ignorer les cas d'erreur
- Stocker des IDs utilisateur en clair
