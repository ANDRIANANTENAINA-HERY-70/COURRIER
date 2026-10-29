# 📖 Guide d'Utilisation - Système de Confirmation de Création de Compte Admin

## 🎯 Pour les Administrateurs

### Vue d'ensemble

Chaque demande de création de compte avec rôle **admin** nécessite votre approbation. Vous recevrez:

1. 📬 Une **notification dans votre tableau de bord** quand quelqu'un demande un compte admin
2. 📧 Optionnellement un **email de notification** (selon configuration)

### Actions à Effectuer

#### 1️⃣ **Consulter les demandes en attente**

**Endpoint**: `GET /api/register-requests`  
**Authentification**: Requise (Admin seulement)

```bash
curl -X GET "http://localhost:8000/api/register-requests" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse esperée**:

```json
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

#### 2️⃣ **Approuver une demande**

Quand vous approuvez une demande:

- ✅ L'utilisateur est créé dans le système
- ✅ Un email de confirmation est envoyé à l'utilisateur
- ✅ L'utilisateur peut maintenant se connecter
- ✅ La demande passe au statut "approved"

**Endpoint**: `POST /api/register-requests/{id}/approve`  
**Authentification**: Requise (Admin seulement)

```bash
curl -X POST "http://localhost:8000/api/register-requests/1/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse esperée**:

```json
{
  "success": true,
  "message": "Compte validé. Une notification a été envoyée à l'utilisateur.",
  "user": {
    "id": 5,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com",
    "role": "admin"
  },
  "request": {
    "id": 1,
    "status": "approved",
    "validated_by": 2,
    "validated_at": "2026-05-13T10:05:00Z"
  }
}
```

#### 3️⃣ **Rejeter une demande**

Quand vous rejetez une demande:

- ❌ L'utilisateur **n'est pas créé** dans le système
- 📧 Un email de notification est envoyé à l'utilisateur
- 🔄 L'utilisateur peut renouveler sa demande
- ✅ La demande passe au statut "rejected"

**Endpoint**: `POST /api/register-requests/{id}/reject`  
**Authentification**: Requise (Admin seulement)

```bash
curl -X POST "http://localhost:8000/api/register-requests/1/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse esperée**:

```json
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

---

## 👥 Pour les Utilisateurs

### Comment Demander un Compte Admin

#### 1️⃣ **Soumettre une demande**

Vous pouvez utiliser l'endpoint `/register` avec `role: "admin"`:

**Endpoint**: `POST /api/register`  
**Authentification**: Non requise

```bash
curl -X POST "http://localhost:8000/api/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Votre Nom\",
    \"email\": \"votre.email@example.com\",
    \"password\": \"VotreMotDePasse123\",
    \"role\": \"admin\"
  }"
```

**Réponse esperée**:

```json
{
  "success": true,
  "message": "Demande envoyée. Un administrateur doit valider la création de ce compte admin.",
  "request": {
    "id": 1,
    "name": "Votre Nom",
    "email": "votre.email@example.com",
    "role": "admin",
    "status": "pending",
    "created_at": "2026-05-13T10:00:00Z"
  }
}
```

#### 2️⃣ **Attendre l'approbation**

- ⏳ Votre demande est en attente (status: "pending")
- 📧 Vous recevrez un email quand un admin approuve ou rejette
- 🔔 Consultez régulièrement votre email

#### 3️⃣ **Cas d'Approbation ✅**

Si approuvée, vous recevrez un email contenant:

- ✅ Confirmation d'approbation
- 👤 Nom de l'admin qui a approuvé
- 🔗 Lien pour vous connecter
- 🔑 Vous pouvez utiliser vos identifiants pour vous connecter

#### 4️⃣ **Cas de Rejet ❌**

Si rejetée, vous recevrez un email contenant:

- ❌ Notification de rejet
- 👤 Nom de l'admin qui a rejeté
- 🔄 Option de renouveler votre demande

---

## 🖼️ Intégration Frontend

### Composant d'Affichage des Demandes (Vue.js / React)

#### État: Liste des demandes en attente

```vue
<template>
  <div class="admin-requests">
    <h2>Demandes de Création de Compte Admin</h2>

    <div v-if="loading" class="spinner">Chargement...</div>

    <div v-else-if="requests.length === 0" class="empty">
      Aucune demande en attente
    </div>

    <div v-else class="requests-list">
      <div v-for="request in requests" :key="request.id" class="request-card">
        <div class="header">
          <h3>{{ request.name }}</h3>
          <span class="badge pending">En attente</span>
        </div>

        <div class="details">
          <p><strong>Email:</strong> {{ request.email }}</p>
          <p><strong>Rôle demandé:</strong> {{ request.role }}</p>
          <p>
            <strong>Date de demande:</strong>
            {{ formatDate(request.created_at) }}
          </p>
        </div>

        <div class="actions">
          <button @click="approveRequest(request.id)" class="btn btn-success">
            ✅ Approuver
          </button>
          <button @click="rejectRequest(request.id)" class="btn btn-danger">
            ❌ Rejeter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      requests: [],
      loading: false,
      token: localStorage.getItem("auth_token"),
    };
  },

  mounted() {
    this.fetchRequests();
  },

  methods: {
    async fetchRequests() {
      this.loading = true;
      try {
        const response = await fetch("/api/register-requests", {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        const data = await response.json();
        this.requests = data.data;
      } catch (error) {
        console.error("Erreur lors du chargement des demandes:", error);
      } finally {
        this.loading = false;
      }
    },

    async approveRequest(requestId) {
      try {
        const response = await fetch(
          `/api/register-requests/${requestId}/approve`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        );

        if (response.ok) {
          alert("Demande approuvée!");
          this.fetchRequests();
        }
      } catch (error) {
        alert("Erreur lors de l'approbation");
      }
    },

    async rejectRequest(requestId) {
      if (confirm("Êtes-vous sûr de vouloir rejeter cette demande?")) {
        try {
          const response = await fetch(
            `/api/register-requests/${requestId}/reject`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${this.token}`,
              },
            },
          );

          if (response.ok) {
            alert("Demande rejetée");
            this.fetchRequests();
          }
        } catch (error) {
          alert("Erreur lors du rejet");
        }
      }
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("fr-FR");
    },
  },
};
</script>

<style scoped>
.admin-requests {
  padding: 20px;
}

.requests-list {
  display: grid;
  gap: 15px;
}

.request-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background: #f9f9f9;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.badge.pending {
  background: #ffc107;
  color: #000;
}

.details p {
  margin: 5px 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn:hover {
  opacity: 0.9;
}

.empty {
  text-align: center;
  padding: 30px;
  color: #666;
}

.spinner {
  text-align: center;
  padding: 30px;
}
</style>
```

### Composant de Demande d'Enregistrement

```vue
<template>
  <div class="register-admin">
    <h2>Demander un Compte Admin</h2>

    <form @submit.prevent="submitRequest" class="form">
      <div class="form-group">
        <label>Nom complet:</label>
        <input
          v-model="form.name"
          type="text"
          required
          placeholder="Votre nom complet"
        />
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input
          v-model="form.email"
          type="email"
          required
          placeholder="votre.email@example.com"
        />
      </div>

      <div class="form-group">
        <label>Mot de passe:</label>
        <input
          v-model="form.password"
          type="password"
          required
          placeholder="Minimum 8 caractères"
          minlength="8"
        />
      </div>

      <div class="form-group">
        <label>Rôle:</label>
        <select v-model="form.role" required>
          <option value="admin">Admin</option>
          <option value="dg">DG</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <button type="submit" class="btn-submit">Soumettre la Demande</button>
    </form>

    <div v-if="message" :class="['message', success ? 'success' : 'error']">
      {{ message }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: "",
        email: "",
        password: "",
        role: "admin",
      },
      message: "",
      success: false,
      loading: false,
    };
  },

  methods: {
    async submitRequest() {
      this.loading = true;
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(this.form),
        });

        const data = await response.json();

        if (response.ok || response.status === 201 || response.status === 202) {
          this.success = true;
          this.message =
            "Demande envoyée avec succès! Un administrateur examinera votre demande.";
          this.form = { name: "", email: "", password: "", role: "admin" };
        } else {
          this.success = false;
          this.message = data.message || "Erreur lors de la soumission";
        }
      } catch (error) {
        this.success = false;
        this.message = "Erreur réseau. Veuillez réessayer.";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.register-admin {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  margin: 20px 0;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.btn-submit {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-submit:hover {
  background: #0056b3;
}

.message {
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
```

---

## 📊 Flux de Statuts

```
                    ┌─────────────┐
                    │   PENDING   │ ◄─ Création de demande
                    └──────┬──────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
            ┌─────────────┐  ┌─────────────┐
            │  APPROVED   │  │  REJECTED   │
            │ Utilisateur │  │ Utilisateur │
            │  créé  ✅   │  │ pas créé ❌ │
            │ Peut se     │  │ Peut        │
            │ connecter   │  │ renouveler  │
            └─────────────┘  └─────────────┘
```

---

## 🔐 Sécurité

✅ **Points de sécurité implémentés:**

- Only admins can approve/reject requests
- Email uniqueness validation
- Password hashing
- Token-based authentication
- Database transaction support

❌ **À éviter comme utilisateur:**

- Ne partagez jamais votre password avec quelqu'un d'autre
- Utilisez un password fort (minimum 8 caractères)

---

## 📞 Troubleshooting

### Je n'ai pas reçu de notification

- Vérifiez que la configuration mail est correcte dans `.env`
- Vérifiez les logs: `storage/logs/laravel.log`
- Vérifiez que le statut est bien "pending"

### Je ne peux pas approuver/rejeter

- Vérifiez que vous êtes connecté en tant qu'admin
- Vérifiez votre token d'authentification
- Vérifiez que le statut de la demande est "pending"

### L'utilisateur a été créé deux fois

- Cela ne devrait pas arriver car on utilise `firstOrCreate`
- Si cela se produit, vérifiez les logs pour les erreurs

---

## 📈 Statistiques et Monitoring

Pour monitorer les demandes:

```sql
-- Nombre de demandes en attente
SELECT COUNT(*) FROM user_requests WHERE status = 'pending';

-- Demandes approuvées aujourd'hui
SELECT COUNT(*) FROM user_requests
WHERE status = 'approved'
AND validated_at >= DATE(NOW());

-- Demandes rejetées
SELECT COUNT(*) FROM user_requests WHERE status = 'rejected';

-- Liste complète avec admin qui a validé
SELECT ur.id, ur.name, ur.email, ur.status, u.name as validated_by
FROM user_requests ur
LEFT JOIN users u ON ur.validated_by = u.id
ORDER BY ur.created_at DESC;
```
