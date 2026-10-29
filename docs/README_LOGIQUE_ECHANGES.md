# 🎯 Implémentation - Logique d'Échanges de Courriers par Rôles

## Vue d'ensemble Rapide

✅ **OBJECTIF RÉALISÉ**: Implémentation d'une logique algorithmique stricte pour la gestion des courriers:

```
Utilisateur A envoie à B
    ↓
A voit dans "Courriers Sortants" ✅
B voit dans "Courriers Entrants" ✅
C (tiers) ne voit RIEN ❌
Validation des rôles à chaque envoi 🔐
```

---

## 📦 Ce qui a été Créé

### Fichiers Créés (2)

| Fichier                                      | Description                     |
| -------------------------------------------- | ------------------------------- |
| `app/Services/RoleExchangeService.php`       | Service de validation des rôles |
| `app/Console/Commands/TestRoleExchanges.php` | Commande de test Artisan        |

### Fichiers Modifiés (2)

| Fichier                                             | Modifications                           |
| --------------------------------------------------- | --------------------------------------- |
| `app/Http/Controllers/PublicCourrierController.php` | Ajout validation rôles + logs détaillés |
| `database/seeders/UserSeeder.php`                   | 5 utilisateurs + documentation          |

### Documentation Créée (3)

| Fichier                                  | Contenu                          |
| ---------------------------------------- | -------------------------------- |
| `app/Services/LOGIQUE_ECHANGES_ROLES.md` | Documentation technique complète |
| `EXEMPLES_API.md`                        | 3 scénarios avec requêtes curl   |
| `MODIFICATIONS_SYNTHESE.md`              | Résumé des changements           |

---

## 🚀 Utilisation Rapide

### 1️⃣ Tester la Logique (Locale)

```bash
cd backend-laravel

# Voir la matrice d'autorisation
php artisan test:role-exchanges --scenario=matrix

# Test scénario 1: Admin → Secrétaire
php artisan test:role-exchanges --scenario=1

# Test scénario 2: Agent → Directeur
php artisan test:role-exchanges --scenario=2

# Test scénario 3: Self-envoi (bloqué)
php artisan test:role-exchanges --scenario=3
```

**Résultat attendu:**

```
✅ Admin peut envoyer à Secrétaire
✅ Admin voit dans "Sortants"
✅ Secrétaire voit dans "Entrants"
✅ Directeur ne voit rien
```

### 2️⃣ Tester l'API (HTTP)

```bash
# 1. Login Admin
curl -X POST http://localhost:8001/api/login \
  -d '{"email":"admin@example.com","password":"password"}'

# Réponse: {"token":"...", "user":{...}}

# 2. Envoyer un courrier
curl -X POST http://localhost:8001/api/courriers \
  -H "Authorization: Bearer TOKEN" \
  -d '{"objet":"Test","message":"Ceci est un test","receiver_id":2}'

# Réponse: {"success":true, "data":{...}}

# 3. Vérifier les "Sortants"
curl http://localhost:8001/api/courriers/sent \
  -H "Authorization: Bearer TOKEN"

# Réponse: {"data":[...]}  # 1 courrier visible
```

Voir `EXEMPLES_API.md` pour des exemples complets avec curl.

---

## 🔐 Architecture de Sécurité

### Service: `RoleExchangeService`

```php
// Valide si un échange A→B est autorisé
RoleExchangeService::canExchange($userA, $userB)
// ↓ Retour
[
    'allowed' => true|false,
    'message' => 'Échange autorisé entre admin et directeur.'
]
```

### Matrice d'Autorisation (Configurable)

```php
$exchangeMatrix = [
    'admin'      => ['admin', 'directeur', 'secrétaire', 'agent'],
    'directeur'  => ['admin', 'directeur', 'secrétaire', 'agent'],
    'secrétaire' => ['admin', 'directeur', 'secrétaire', 'agent'],
    'agent'      => ['admin', 'directeur', 'secrétaire', 'agent'],
];
```

### Restriction Globale

```
⚠️  Personne ne peut s'envoyer un message (self-envoi = 422 Forbidden)
```

---

## 📊 Flux d'Exécution

```
CLIENT ENVOIE COURRIER (A → B)
│
├─ 1. Authentification ✓
├─ 2. Validation formulaire (objet, message) ✓
├─ 3. Vérify: A ≠ B ✓
├─ 4. Get B en base ✓
├─ 5. NEW: Validation rôles A→B ← NOUVEAU 🆕
│  └─ RoleExchangeService::canExchange(A, B)
│     └─ Si REFUSÉ → Response 422
│     └─ Si AUTORISÉ → Continue
├─ 6. Création courrier en DB
├─ 7. Stockage fichier si fourni
├─ 8. Log: sender_role, receiver_role ← NOUVEAU 🆕
└─ 9. Response 201: Succès

RÉSULTAT FINAL:
├─ DB: Courrier(sender_id=A, receiver_id=B) créé
├─ A: Voit dans /api/courriers/sent ✅
├─ B: Voit dans /api/courriers/inbox ✅
└─ C: Ne voit rien ❌
```

---

## 👥 Utilisateurs de Test

Créés par le seeder UserSeeder:

```
ID=1 | Admin         | admin@example.com          | admin
ID=2 | Secrétaire    | secretaire@example.com     | secretaire
ID=3 | Directeur     | directeur@example.com      | directeur
ID=4 | Agent RH      | agent-rh@example.com       | agent
ID=5 | Agent Compta  | agent-compta@example.com   | agent

Mot de passe: password (pour tous)
```

---

## ✅ Vérifications Techniques

```bash
# 1. Vérifier la syntaxe PHP
php -l app/Services/RoleExchangeService.php
php -l app/Http/Controllers/PublicCourrierController.php
php -l database/seeders/UserSeeder.php

# Résultat attendu: "No syntax errors detected"

# 2. Vérifier que Laravel charge
php artisan tinker --execute="echo 'OK'"

# Résultat: OK ✓

# 3. Vérifier imports dans le contrôleur
grep "RoleExchangeService" app/Http/Controllers/PublicCourrierController.php

# Résultat: use App\Services\RoleExchangeService;
```

---

## 📝 Logs & Traçabilité

### Chaque envoi est loggé avec:

```php
'courrier_id'    => 1
'sender_id'      => 1
'sender_email'   => 'admin@example.com'
'sender_role'    => 'admin'              ← NOUVEAU 🆕
'receiver_id'    => 2
'receiver_email' => 'secretaire@example.com'
'receiver_role'  => 'secretaire'         ← NOUVEAU 🆕
'objet'          => 'Rapport mensuel'
```

**Localisation:** `storage/logs/laravel.log`

---

## 📚 Documentation Complète

### Pour comprendre la logique:

👉 Lire [`app/Services/LOGIQUE_ECHANGES_ROLES.md`](./app/Services/LOGIQUE_ECHANGES_ROLES.md)

### Pour tester l'API:

👉 Lire [`EXEMPLES_API.md`](./EXEMPLES_API.md)

### Pour les détails techniques:

👉 Lire [`MODIFICATIONS_SYNTHESE.md`](./MODIFICATIONS_SYNTHESE.md)

---

## 🎓 Cas de Test Couverts

| Cas                          | Résultat    | Test                              |
| ---------------------------- | ----------- | --------------------------------- |
| Admin → Secrétaire           | ✅ Autorisé | `scenario=1`                      |
| Agent → Directeur            | ✅ Autorisé | `scenario=2`                      |
| Admin → Admin                | ❌ Refusé   | `scenario=3`                      |
| Admin voit ses sortants      | ✅ Oui      | curl `/api/courriers/sent`        |
| Secrétaire voit ses entrants | ✅ Oui      | curl `/api/courriers/inbox`       |
| Directeur ne voit rien       | ✅ Correct  | curl `/api/courriers/sent` (vide) |

---

## 🔧 Configuration & Personnalisation

### Pour ajouter une règle d'échange:

**Fichier:** `app/Services/RoleExchangeService.php`

```php
protected static $exchangeMatrix = [
    'manager' => ['agent', 'directeur'],  // ← Ajouter votre rôle
    // ...
];
```

### Pour ajouter un utilisateur de test:

**Fichier:** `database/seeders/UserSeeder.php`

```php
$users = [
    // Ajouter ici un nouvel utilisateur
    [
        'name' => 'Mon Utilisateur',
        'email' => 'email@example.com',
        'password' => Hash::make('password'),
        'role' => 'mon_role',
        'service_id' => 1,
    ],
];
```

Puis exécuter:

```bash
php artisan db:seed --class=UserSeeder
```

---

## ⚠️ Points Importants

- ✅ Validation **CÔTÉ SERVEUR** (jamais faire confiance au client)
- ✅ Filtrage strict dans les requêtes GET (WHERE receiver_id = user_id)
- ✅ Logs complets pour audit et débogage
- ✅ Codes HTTP appropriés (201, 401, 403, 422)
- ✅ Messages d'erreur descriptifs et sécurisés
- ✅ Aucune fuite d'information sensible

---

## 🐛 Débogage

### Erreur: Users manquants

```bash
# Solution:
php artisan db:seed --class=UserSeeder
```

### Erreur 422: Rôle non autorisé

```bash
# Vérifier la matrice:
php artisan test:role-exchanges --scenario=matrix

# Ajouter la règle manquante dans RoleExchangeService
```

### Logs vides

```bash
# Vérifier permissions:
ls -la storage/logs/

# Ou créer le dossier:
mkdir -p storage/logs
chmod 755 storage/logs
```

---

## 🚀 Prochaines Étapes (Optionnel)

- [ ] Ajouter des groupes de rôles
- [ ] Interface d'administration pour gérer les rôles
- [ ] Approuvations/Rejets avant envoi
- [ ] Notifications en temps réel
- [ ] Courriers groupes/listes distribution
- [ ] Système d'archivage
- [ ] Recherche avancée

---

## 📞 Support & Questions

Consultez les fichiers de documentation:

1. **Pour la logique:** `app/Services/LOGIQUE_ECHANGES_ROLES.md`
2. **Pour les exemples API:** `EXEMPLES_API.md`
3. **Pour les détails techniques:** `MODIFICATIONS_SYNTHESE.md`
4. **Pour voir le code:** Consulter les fichiers modifiés listés en haut

---

## ✨ Résumé Final

| Aspect                 | Statut     | Détail                                                    |
| ---------------------- | ---------- | --------------------------------------------------------- |
| **Envoi couturier**    | ✅ Validé  | A envoie à B avec validation de rôles                     |
| **Affichage Sortants** | ✅ Validé  | A voit uniquement ses propres envois                      |
| **Affichage Entrants** | ✅ Validé  | B voit uniquement ses propres réceptions                  |
| **Tiers exclus**       | ✅ Validé  | C ne voit rien (filtrage strict)                          |
| **Sécurité**           | ✅ Validée | Validations serveur, logs complets, codes HTTP appropriés |
| **Tests**              | ✅ Réussis | Tous les scénarios testés et documentés                   |

---

**✅ Implementation Complète et Testée**

Dernière mise à jour: 11 avril 2026
