# Implementation: Actions Utilisateurs (Activer/Désactiver & Code de Réinitialisation)

## Résumé

Cette documentation décrit l'implémentation des actions suivantes dans la page Utilisateurs :
1. **Activer/Désactiver un compte utilisateur**
2. **Voir le code de réinitialisation de mot de passe**
3. **Amélioration des boutons d'action**

## État des lieux

### Backend (Laravel)

Les routes API suivantes sont déjà implémentées dans `backend-laravel/routes/api.php` :

```php
// Routes protégées (nécessitent authentification)
Route::patch('/users/{id}/status', [AuthController::class, 'toggleUserStatus']);
Route::get('/users/{id}/reset-code', [AuthController::class, 'getUserResetCode']);
```

Les méthodes correspondantes dans `AuthController.php` :

1. **`toggleUserStatus`** (lignes 433-464) :
   - Vérifie que l'utilisateur est admin
   - Empêche la désactivation du dernier admin
   - Bascule l'état `is_active` de l'utilisateur
   - Retourne le statut mis à jour

2. **`getUserResetCode`** (lignes 510-543) :
   - Vérifie que l'utilisateur est admin
   - Récupère le code de réinitialisation non utilisé le plus récent
   - Retourne le code, l'email de l'utilisateur et la date d'expiration

### Frontend (React)

Le fichier `frontend-react/src/pages/Utilisateurs.jsx` contient :

1. **`toggleStatus`** (lignes 150-200) :
   - Affiche une confirmation avant l'action
   - Appelle l'API `PATCH /users/{id}/status`
   - Met à jour l'état local après succès
   - Affiche un message de confirmation ou d'erreur

2. **`viewResetCode`** (lignes 255-285) :
   - Ouvre une modale
   - Appelle l'API `GET /users/{id}/reset-code`
   - Affiche le code dans une boîte avec bouton de copie
   - Gère les erreurs et les cas sans code disponible

## Modifications apportées

### 1. Boutons d'action améliorés (Utilisateurs.jsx)

Les boutons ont été modifiés pour inclure des libellés textuels en plus des icônes :

```jsx
{/* Activer/Désactiver */}
<motion.button
  className={`action-btn toggle-status ${user.status === 'actif' ? 'deactivate' : 'activate'}`}
  title={user.status === 'actif' ? 'Désactiver le compte' : 'Activer le compte'}
  onClick={() => toggleStatus(user)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  disabled={actionLoading}
>
  {user.status === 'actif' ? <FiLock /> : <FiUnlock />}
  <span>{user.status === 'actif' ? 'Désactiver' : 'Activer'}</span>
</motion.button>

{/* Voir le code de réinitialisation */}
<motion.button 
  className="action-btn view-code"
  title="Voir le code de réinitialisation"
  onClick={() => viewResetCode(user)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  disabled={actionLoading}
>
  <FiEye />
  <span>Code</span>
</motion.button>

{/* Supprimer */}
<motion.button 
  className="action-btn delete"
  title="Supprimer le compte"
  onClick={() => handleDelete(user)}
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  disabled={actionLoading}
>
  <FiTrash2 />
  <span>Supprimer</span>
</motion.button>
```

### 2. Styles CSS améliorés (Utilisateurs.css)

Nouvelles classes CSS pour les boutons :

```css
/* Bouton Activer - vert */
.action-btn.activate {
  color: var(--success);
}
.action-btn.activate:hover {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

/* Bouton Désactiver - orange */
.action-btn.deactivate {
  color: #f59e0b;
}
.action-btn.deactivate:hover {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

/* Bouton Code - bleu */
.action-btn.view-code {
  color: var(--info, #3b82f6);
}
.action-btn.view-code:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--info, #2563eb);
}

/* Bouton Supprimer - rouge */
.action-btn.delete {
  color: var(--danger);
}
.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}
```

## Tests effectués

### Test API - Toggle Status

```bash
# Désactiver un utilisateur
curl -X PATCH http://localhost:8000/api/users/2/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Réponse: {"success":true,"message":"Utilisateur désactivé avec succès","user":{...}}

# Réactiver un utilisateur
curl -X PATCH http://localhost:8000/api/users/2/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Réponse: {"success":true,"message":"Utilisateur activé avec succès","user":{...}}
```

### Test API - Reset Code

```bash
curl -X GET http://localhost:8000/api/users/2/reset-code \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"

# Réponse: {"success":true,"message":"Code de réinitialisation récupéré","code":"141851","user_email":"secretaire@example.com","expires_at":"2026-05-21T08:32:52.000000Z"}
```

## Fonctionnalités

### 1. Activer/Désactiver un compte

- **Icône** : Cadenas fermé (🔒) pour désactiver, cadenat ouvert (🔓) pour activer
- **Couleur** : Vert pour activer, Orange pour désactiver
- **Confirmation** : Fenêtre de confirmation avant l'action
- **Message** : Notification de succès ou d'erreur en haut à droite

### 2. Voir le code de réinitialisation

- **Icône** : Œil (👁️)
- **Couleur** : Bleu
- **Modale** : Affiche le code dans une boîte avec police monospace
- **Copie** : Bouton "Copier" pour copier le code dans le presse-papiers
- **Gestion d'erreur** : Message si aucun code n'est disponible

### 3. Supprimer un compte

- **Icône** : Poubelle (🗑️)
- **Couleur** : Rouge
- **Confirmation** : Fenêtre de confirmation avec avertissement
- **Message** : Notification de succès ou d'erreur

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page Utilisateurs                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Activer   │  │    Code     │  │  Supprimer  │              │
│  │  /Désactiver│  │ Réinit. MDP │  │   Compte    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Laravel                           │    │
│  │  PATCH /users/{id}/status    → toggleUserStatus()       │    │
│  │  GET  /users/{id}/reset-code → getUserResetCode()       │    │
│  │  DELETE /users/{id}          → deleteUser()             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Conclusion

Les actions Activer/Désactiver et Voir le code de réinitialisation sont maintenant pleinement fonctionnelles avec :
- ✅ API backend opérationnelle
- ✅ Interface frontend améliorée avec libellés textuels
- ✅ Code couleur pour une meilleure UX
- ✅ Confirmations avant actions destructrices
- ✅ Messages de feedback utilisateur
- ✅ Build frontend réussi