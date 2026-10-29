# 📋 Test du Flux de Réinitialisation de Mot de Passe

## ✅ Vérification Complète du Système

### 🎯 Logique Attendue

Quand un utilisateur oublie son mot de passe:

1. Il clique sur "Mot de passe oublié"
2. Il entre son email
3. Il clique "Demander le code"
4. **Automatiquement** un message est envoyé aux administrateurs actifs
5. Le courrier apparaît dans les **courriers entrants** des admins
6. Une **notification non lue** apparaît pour les admins

---

## 🔍 Composants du Système

### Backend

#### 1. **AuthController::forgotPassword()**

- Route: `POST /api/auth/forgot-password`
- Reçoit: `{ email: string }`
- Crée: Une `PasswordResetRequest` avec code aléatoire
- Notifie: Tous les admins actifs via `notifyActiveAdmins()`

#### 2. **AdminPasswordResetNotification**

- Type: Notification Larval (database)
- Actions:
  - Crée un **Courrier** avec:
    - `objet`: "🔐 Demande de réinitialisation de mot de passe"
    - `sender_id`: User qui demande la réinitialisation
    - `receiver_id`: Admin qui reçoit la demande
    - `type`: "password_reset_request"
    - `statut`: "en_attente"
    - `priorite`: "urgente"
  - Crée une **Notification database** avec les données

#### 3. **PasswordResetRequest Model**

- Stocke: email, code, expires_at, used_at
- Code: 6 chiffres aléatoires
- Expiration: 15 minutes par défaut

### Frontend

#### 1. **Login.jsx - Formulaire "Mot de passe oublié"**

- Méthode: `handleRequestCode()`
- Appelle: `forgotPassword(email)`
- Affiche: Message de succès si réussi

#### 2. **ForgotPasswordCode.jsx - Page de code**

- Reçoit: `email` en paramètre de query
- Vérifie: Le code via `verifyResetCode()`
- Redirige: Vers page de nouveau mot de passe

#### 3. **ResetPassword.jsx - Réinitialisation**

- Récupère: Email et code
- Met à jour: Le mot de passe si valide

---

## 🧪 Points à Vérifier

### ✅ Backend

- [x] Table `password_reset_requests` existe
- [x] Migration `password_reset_requests` appliquée
- [x] Modèle `PasswordResetRequest` correctement défini
- [x] Notification `AdminPasswordResetNotification` existe
- [x] Route `/auth/forgot-password` accessible
- [x] Route `/auth/verify-reset-code` accessible
- [x] Route `/auth/reset-password` accessible
- [x] Au moins un admin existe en base de données
- [x] Admin a `role = 'admin'` et `is_active = true` (ou NULL)

### 🆚 Admins Actifs

Les admins qui recevront la notification doivent avoir:

```php
// Critères de sélection
role = 'admin' AND (is_active IS NULL OR is_active = true)
```

### 📬 Courriers

Le courrier créé doit apparaître:

1. **Dans les courriers entrants** de l'admin (courrier.receiver_id = admin.id)
2. Avec `statut = 'en_attente'`
3. Avec `type = 'password_reset_request'`
4. Avec `priorite = 'urgente'`

### 🔔 Notifications

La notification database créée doit avoir:

1. `type = 'password_reset_request'`
2. `read_at = NULL` (non lue)
3. Contient: `user_name`, `user_email`, `code`, `expires_at`, `courrier_id`

---

## 🧬 Flux d'Appels

```
Frontend: POST /auth/forgot-password {email}
    ↓
AuthController::forgotPassword()
    ├→ Valide email (existe en base)
    ├→ Crée PasswordResetRequest (code + expiration)
    ├→ Appelle notifyActiveAdmins()
    │   └→ Pour chaque admin:
    │       ├→ Crée AdminPasswordResetNotification
    │       │   ├→ Crée Courrier
    │       │   └→ Envoie Notification database
    │       └→ Admin→notify(notification)
    └→ Retour: "Demande enviée aux admins"

Frontend: POST /auth/verify-reset-code {email, code}
    ↓
AuthController::verifyResetCode()
    ├→ Cherche PasswordResetRequest
    ├→ Vérifie: code valide, non expiré, non utilisé
    └→ Retour: Success/Error

Frontend: POST /auth/reset-password {email, code, password}
    ↓
AuthController::resetPassword()
    ├→ Vérifie PasswordResetRequest
    ├→ Met à jour User password
    ├→ Marque PasswordResetRequest comme used
    └→ Retour: Success
```

---

## 🎬 Scénario de Test Complet

### Étape 1: Préparer les données

✅ Vérifier que:

- Un utilisateur ordinaire existe (email: test@example.com)
- Au moins un admin existe avec `role='admin'` et `is_active=true`

### Étape 2: Demander le code (Frontend)

1. Aller sur la page Login
2. Cliquer "Mot de passe oublié"
3. Entrer l'email de l'utilisateur
4. Cliquer "Demander le code"
5. ✅ Message: "Votre demande a été envoyée aux administrateurs actifs."

### Étape 3: Vérifier en Database

```sql
-- Vérifier PasswordResetRequest créé
SELECT * FROM password_reset_requests
WHERE email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;

-- Vérifier Courrier créé
SELECT * FROM courriers
WHERE type = 'password_reset_request'
AND sender_id = (SELECT id FROM users WHERE email = 'test@example.com')
ORDER BY created_at DESC LIMIT 1;

-- Vérifier Notification créée
SELECT * FROM notifications
WHERE type = 'password_reset_request'
ORDER BY created_at DESC LIMIT 1;
```

### Étape 4: Vérifier comme Admin

1. Se connecter en tant qu'admin
2. Aller dans "Courriers Entrants"
3. ✅ Voir le courrier "🔐 Demande de réinitialisation de mot de passe"
4. Cliquer sur le courrier
5. ✅ Voir le code de réinitialisation
6. ✅ Voir la notification avec la marque "non lue"

### Étape 5: Vérifier le Code

1. En tant qu'utilisateur, aller sur "Mot de passe oublié → Code"
2. Entrer le code affiché dans le courrier
3. ✅ Code validé avec succès
4. ✅ Redirection vers page "Nouveau mot de passe"

### Étape 6: Réinitialiser le Mot de Passe

1. Entrer nouveau mot de passe
2. Confirmer le mot de passe
3. Cliquer "Réinitialiser"
4. ✅ "Mot de passe réinitialisé avec succès"
5. ✅ Vérifier en database: `used_at` est rempli dans password_reset_requests

---

## 🐛 Diagnostics en Cas de Problème

### Le courrier n'apparaît pas

```sql
-- Vérifier si admin existe et est actif
SELECT id, name, email, role, is_active FROM users WHERE role = 'admin';

-- Vérifier si notification a été créée
SELECT * FROM notifications WHERE type = 'password_reset_request';

-- Vérifier les logs
tail -f storage/logs/laravel.log | grep -i password
```

### La notification n'est pas marquée comme non lue

```sql
-- Vérifier read_at
SELECT * FROM notifications WHERE type = 'password_reset_request' AND read_at IS NULL;
```

### Le code ne fonctionne pas

```sql
-- Vérifier expiration
SELECT *, NOW() AS maintenant, expires_at FROM password_reset_requests
WHERE email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;
```

---

## 📊 Résumé des Vérifications

| Composant                        | Status | Notes                              |
| -------------------------------- | ------ | ---------------------------------- |
| Endpoint `/auth/forgot-password` | ✅     | Crée code et notifie admins        |
| Courrier créé                    | ✅     | Type: password_reset_request       |
| Notification DB créée            | ✅     | Type: password_reset_request       |
| Notification non lue             | ✅     | read_at IS NULL                    |
| Courrier en attente              | ✅     | statut = 'en_attente'              |
| Admin reçoit notification        | ✅     | Via AdminPasswordResetNotification |
| Verification code works          | ✅     | verifyResetCode endpoint           |
| Password reset works             | ✅     | resetPassword endpoint             |

---

## 🚀 Instruction pour Tester Rapidement

```bash
# 1. Terminal Backend Laravel
cd backend-laravel
php artisan tinker

# 2. Dans Tinker
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => Hash::make('password123'),
        'role' => 'agent'
    ]);
}

$admin = User::where('role', 'admin')->first();
echo "Admin actif: " . ($admin ? $admin->email : "NONE");
echo "Admin is_active: " . ($admin ? $admin->is_active : "N/A");

# 3. Frontend - faire la requête
# CURL ou Frontend - POST /auth/forgot-password avec email test@example.com

# 4. Vérifier en DB
# SELECT * FROM password_reset_requests ORDER BY created_at DESC LIMIT 1;
# SELECT * FROM courriers WHERE type = 'password_reset_request' ORDER BY created_at DESC LIMIT 1;
# SELECT * FROM notifications WHERE type = 'password_reset_request' ORDER BY created_at DESC LIMIT 1;

# 5. Login en tant qu'admin et vérifier les courriers entrants
```
