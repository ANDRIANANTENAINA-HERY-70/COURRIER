# Exemples d'Utilisation de l'API - Échanges de Courriers par Rôles

## Configuration de Test

### Utilisateurs de Test

```
ID=1 | Admin          | admin@example.com      | Rôle: admin
ID=2 | Secrétaire     | secretaire@example.com | Rôle: secretaire
ID=3 | Directeur      | directeur@example.com  | Rôle: directeur
ID=4 | Agent RH       | agent-rh@example.com   | Rôle: agent
ID=5 | Agent Compta   | agent-compta@example.com | Rôle: agent
```

Tous les utilisateurs ont le mot de passe: `password`

## Scénario 1: Admin (A) envoie à Secrétaire (B)

### Contexte

- **A = Admin** (ID: 1, email: admin@example.com)
- **B = Secrétaire** (ID: 2, email: secretaire@example.com)
- **C = Directeur** (ID: 3, email: directeur@example.com) - Tiers

### Étape 1: Login Admin (A)

```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

**Réponse:**

```json
{
    "success": true,
    "token": "TOKEN_ADMIN",
    "user": {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "role": "admin"
    }
}
```

### Étape 2: Admin (A) envoie un courrier à Secrétaire (B) ✅

```bash
curl -X POST http://localhost:8001/api/courriers \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "objet": "Rapport mensuel direction",
    "message": "Veuillez préparer le rapport du mois",
    "receiver_id": 2
  }'
```

**Réponse 201 (Succès):**

```json
{
    "success": true,
    "message": "Courrier envoyé avec succès. Le destinataire le recevra dans ses courriers entrants.",
    "data": {
        "id": 1,
        "objet": "Rapport mensuel direction",
        "message": "Veuillez préparer le rapport du mois",
        "sender_id": 1,
        "receiver_id": 2,
        "sender": {
            "id": 1,
            "name": "Admin",
            "email": "admin@example.com",
            "role": "admin"
        },
        "receiver": {
            "id": 2,
            "name": "Secrétaire",
            "email": "secretaire@example.com",
            "role": "secretaire"
        }
    }
}
```

### Étape 3: Admin (A) voit le courrier dans "Sortants" ✅

```bash
curl -X GET http://localhost:8001/api/courriers/sent \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

**Réponse:**

```json
{
    "success": true,
    "message": "Courriers sortants chargés avec succès.",
    "data": [
        {
            "id": 1,
            "objet": "Rapport mensuel direction",
            "message": "Veuillez préparer le rapport du mois",
            "sender_id": 1,
            "receiver_id": 2,
            "created_at": "2026-04-11 15:30:00",
            "receiver": {
                "id": 2,
                "name": "Secrétaire",
                "email": "secretaire@example.com",
                "role": "secretaire"
            }
        }
    ]
}
```

### Étape 4: Secrétaire (B) voit le courrier dans "Entrants" ✅

```bash
# Login Secrétaire
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "secretaire@example.com",
    "password": "password"
  }'
# Réponse: TOKEN_SECRETAIRE

# Voir les courriers entrants
curl -X GET http://localhost:8001/api/courriers/inbox \
  -H "Authorization: Bearer TOKEN_SECRETAIRE"
```

**Réponse:**

```json
{
    "success": true,
    "message": "Courriers entrants chargés avec succès.",
    "data": [
        {
            "id": 1,
            "objet": "Rapport mensuel direction",
            "message": "Veuillez préparer le rapport du mois",
            "sender_id": 1,
            "receiver_id": 2,
            "created_at": "2026-04-11 15:30:00",
            "sender": {
                "id": 1,
                "name": "Admin",
                "email": "admin@example.com",
                "role": "admin"
            }
        }
    ]
}
```

### Étape 5: Directeur (C) ne voit PAS le courrier ❌

```bash
# Login Directeur
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "directeur@example.com",
    "password": "password"
  }'
# Réponse: TOKEN_DIRECTEUR

# Vérifier les courriers sortants (aucun n'a été envoyé par directeur)
curl -X GET http://localhost:8001/api/courriers/sent \
  -H "Authorization: Bearer TOKEN_DIRECTEUR"
```

**Réponse:**

```json
{
    "success": true,
    "message": "Courriers sortants chargés avec succès.",
    "data": [] // ✓ Aucun courrier
}
```

```bash
# Vérifier les courriers entrants (aucun n'a été reçu par directeur)
curl -X GET http://localhost:8001/api/courriers/inbox \
  -H "Authorization: Bearer TOKEN_DIRECTEUR"
```

**Réponse:**

```json
{
    "success": true,
    "message": "Courriers entrants chargés avec succès.",
    "data": [] // ✓ Aucun courrier
}
```

---

## Scénario 2: Tentative d'Envoi Invalide - Même Utilisateur ❌

### Étape 1: Admin tente de s'envoyer un courrier

```bash
curl -X POST http://localhost:8001/api/courriers \
  -H "Authorization: Bearer TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "objet": "Test auto",
    "message": "Auto-envoi",
    "receiver_id": 1
  }'
```

**Réponse 422 (Erreur):**

```json
{
    "success": false,
    "message": "Vous ne pouvez pas vous envoyer un message."
}
```

---

## Scénario 3: Envoi Autorisé par Compatibilité de Rôles ✅

### Contexte

- **A = Agent RH** (ID: 4)
- **B = Directeur** (ID: 3)
- Relation: Agent peut envoyer à Directeur ✓

```bash
# Agent RH essaie d'envoyer au Directeur
curl -X POST http://localhost:8001/api/courriers \
  -H "Authorization: Bearer TOKEN_AGENT_RH" \
  -H "Content-Type: application/json" \
  -d '{
    "objet": "Demande de congé",
    "message": "Demande pour la semaine du 15 avril",
    "receiver_id": 3
  }'
```

**Réponse 201 (Succès):**

```json
{
    "success": true,
    "message": "Courrier envoyé avec succès..."
}
```

---

## Tableau de Résumé des Cas

| Cas | Expéditeur | Destinataire | Autorisé | Raison                          |
| --- | ---------- | ------------ | -------- | ------------------------------- |
| 1   | Admin      | Secrétaire   | ✅       | Admin peut envoyer à tous       |
| 2   | Agent      | Directeur    | ✅       | Agent peut envoyer au Directeur |
| 3   | Admin      | Admin        | ❌       | Self-envoi interdit             |
| 4   | Agent      | Agent        | ✅       | Agent peut envoyer à Agent      |
| 5   | Directeur  | Secrétaire   | ✅       | Directeur peut envoyer à tous   |

---

## Points Clés à Tester

- ✅ **A envoie à B** → Visible dans "Sortants" d'A et "Entrants" de B
- ❌ **C ne voit rien** → Les listes de C sont vides (sauf ses propres échanges)
- ❌ **Self-envoi bloqué** → Message d'erreur approprié
- ✅ **Validation des rôles** → Respect de la matrice d'autorisation
- 🔐 **Authentification requise** → Toutes les opérations nécessitent un token valide

---

## Logs Attendus

Pour chaque opération, vérifier dans `storage/logs/laravel.log`:

```
[2026-04-11 15:30:00] local.INFO: Courrier envoyé avec succès [
  "courrier_id" => 1
  "sender_id" => 1
  "sender_email" => "admin@example.com"
  "sender_role" => "admin"
  "receiver_id" => 2
  "receiver_email" => "secretaire@example.com"
  "receiver_role" => "secretaire"
  "objet" => "Rapport mensuel direction"
]

[2026-04-11 15:31:00] local.INFO: Courriers entrants chargés [
  "user_id" => 2
  "user_email" => "secretaire@example.com"
  "user_role" => "secretaire"
  "courriers_count" => 1
]
```
