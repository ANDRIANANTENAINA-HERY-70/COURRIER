# 🔐 Système de Confirmation de Création de Compte Admin

## 📋 Vue d'ensemble

Ce système assure qu'un administrateur existant doit approuver la création de tout nouveau compte avec le rôle **admin**. Un flux de notifications automatiques informe les administrateurs et l'utilisateur du statut de la demande.

## 🔄 Flux Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur soumet une demande de compte admin               │
│    POST /api/register ou POST /api/register-request             │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Demande créée en attente (status="pending")                   │
│    Table: user_requests                                         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. 🔔 Notification envoyée à TOUS les administrateurs existants  │
│    Notification: AdminAccountCreationRequest                    │
│    Stockée en: Table notifications                              │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────┬──────────────────────┐
│ Admin examine        │ Clique sur le lien   │
│ la notification      │ dans son tableau     │
│ depuis son tableau   │ de bord              │
└──────────────────────┴──────────────────────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌──────────────┐  ┌──────────────┐
│ APPROUVER    │  │ REJETER      │
│ POST /api/   │  │ POST /api/   │
│ register-    │  │ register-    │
│ requests/{id}│  │ requests/{id}│
│ /approve     │  │ /reject      │
└──────┬───────┘  └───────┬──────┘
       │                  │
       ▼                  ▼
   Utilisateur       Email de rejet
   créé dans DB      envoyé à
   (status=approved) l'utilisateur
   │
   │ 🔔 Email d'approbation
   │ envoyé: AdminAccount
   │ ApprovedNotification
   │
   ▼
Utilisateur peut
se connecter
```

## 📧 Notifications Envoyées

### 1. **AdminAccountCreationRequest**

- **Destinataire**: Tous les administrateurs existants
- **Quand**: Immédiatement après qu'un utilisateur demande un compte admin
- **Canal**: Base de données (notifications table)
- **Données**:
  - `user_request_id`: ID de la userequest
  - `requester_name`: Nom de la personne qui demande
  - `requester_email`: Email du demandeur
  - `requester_role`: Le rôle demandé (toujours 'admin')
  - `message`: Message descriptif
  - `action_url`: Lien vers le tableau d'administration

### 2. **AdminAccountApprovedNotification**

- **Destinataire**: Utilisateur dont le compte a été approuvé
- **Quand**: Après qu'un admin approuve la demande
- **Canaux**: Base de données + Email
- **Données**:
  - `user_request_id`: ID de la demande
  - `approved_by`: Nom de l'admin qui a approuvé
  - `approved_at`: Timestamp de l'approbation

### 3. **AdminAccountRejectedNotification**

- **Destinataire**: Utilisateur dont la demande a été rejetée
- **Quand**: Après qu'un admin rejette la demande
- **Canal**: Email simple (texte)
- **Données**:
  - `user_request_id`: ID de la demande
  - `rejected_by`: Nom de l'admin qui a rejeté
  - `rejected_at`: Timestamp du rejet

## 🔌 Points de Terminaison Impliqués

### Demande de Création de Compte (Publique)

```bash
POST /api/register
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean.dupont@example.com",
  "password": "SecurePassword123",
  "role": "admin"
}

Response (202):
{
  "success": true,
  "message": "Demande envoyée. Un administrateur doit valider la création de ce compte admin.",
  "request": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "admin",
    "status": "pending",
    "created_at": "2026-05-13T10:00:00Z"
  }
}
```

### Liste des Demandes en Attente (Admin seulement)

```bash
GET /api/register-requests
Authorization: Bearer ADMIN_TOKEN

Response (200):
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com",
      "role": "admin",
      "status": "pending",
      "created_at": "2026-05-13T10:00:00Z"
    }
  ]
}
```

### Approver une Demande (Admin seulement)

```bash
POST /api/register-requests/1/approve
Authorization: Bearer ADMIN_TOKEN

Response (200):
{
  "success": true,
  "message": "Compte validé. Une notification a été envoyée à l'utilisateur.",
  "user": {
    "id": 1,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "admin",
    "is_active": false
  },
  "request": {
    "id": 1,
    "status": "approved",
    "validated_by": 2,
    "validated_at": "2026-05-13T10:05:00Z"
  }
}
```

### Rejeter une Demande (Admin seulement)

```bash
POST /api/register-requests/1/reject
Authorization: Bearer ADMIN_TOKEN

Response (200):
{
  "success": true,
  "message": "Demande refusée. Une notification a été envoyée à l'utilisateur.",
  "request": {
    "id": 1,
    "status": "rejected",
    "validated_by": 2,
    "validated_at": "2026-05-13T10:05:00Z"
  }
}
```

## 🗄️ Schéma de Base de Données

### Table: `user_requests`

```sql
- id (PK)
- name (string)
- email (string, unique)
- password (string, hashed)
- role (enum: admin, dg, sg, ...)
- status (enum: pending, approved, rejected) [default: pending]
- validated_by (FK → users.id, nullable)
- validated_at (timestamp, nullable)
- created_at
- updated_at
```

### Table: `notifications`

```sql
- id (PK)
- notifiable_type (string) → 'App\Models\User'
- notifiable_id (unsigned big integer) → User ID
- type (string) → Class name
- data (json)
- read_at (timestamp, nullable)
- created_at
```

## 🧪 Scénarios de Test

### Scénario 1: Demande d'un nouveau compte admin

1. Utilisateur POST à `/api/register` avec `role=admin`
2. Vérifier que la demande est créée avec `status=pending`
3. Vérifier qu'une notification est envoyée aux admins existants
4. Admin voit la notification dans son tableau de bord

### Scénario 2: Approbation d'une demande

1. Admin POST à `/api/register-requests/{id}/approve`
2. Vérifier que l'utilisateur est créé dans la table `users`
3. Vérifier que `status` passe à `approved`
4. Vérifier que l'utilisateur reçoit un email d'approbation
5. Utilisateur peut se connecter

### Scénario 3: Rejet d'une demande

1. Admin POST à `/api/register-requests/{id}/reject`
2. Vérifier que `status` passe à `rejected`
3. Vérifier que l'utilisateur reçoit un email de rejet
4. Utilisateur ne peut pas se connecter
5. Utilisateur peut renouveler sa demande

## 🔐 Sécurité

- ✅ Seuls les utilisateurs avec `role=admin` peuvent approuver/rejeter
- ✅ Les demandes doivent être dans le statut `pending` pour être traitées
- ✅ Le mot de passe est hashé avant stockage
- ✅ Les emails sont uniques (vérification en base de données)
- ✅ Les notifications sont stockées de manière sécurisée

## 📝 Fichiers Modifiés

- `app/Notifications/AdminAccountCreationRequest.php` (nouveau)
- `app/Notifications/AdminAccountApprovedNotification.php` (nouveau)
- `app/Notifications/AdminAccountRejectedNotification.php` (nouveau)
- `app/Http/Controllers/UserRequestController.php` (modifié)
- `app/Http/Controllers/AuthController.php` (modifié)

## 🚀 Déploiement

1. **Exécuter les migrations** (si nécessaire):

   ```bash
   php artisan migrate
   ```

2. **Vérifier la configuration du mail** dans `.env`:

   ```
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.example.com
   MAIL_PORT=587
   MAIL_USERNAME=your-email@example.com
   MAIL_PASSWORD=your-password
   MAIL_FROM_ADDRESS=noreply@example.com
   ```

3. **Redémarrer les artisans** (si queue workers sont actifs):

   ```bash
   php artisan queue:restart
   ```

4. **Tester le flux**:
   Voir section "Scénarios de Test" ci-dessous.

## 📞 Support

Pour toute question ou problème:

- Vérifier les logs à `storage/logs/laravel.log`
- Vérifier la table `notifications` pour voir les notifications créées
- Vérifier la table `user_requests` pour voir le statut des demandes
