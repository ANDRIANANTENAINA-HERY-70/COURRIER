# 🎯 Guide d'utilisation - Affichage des erreurs

## 📚 Comment utiliser dans votre application

### Cas 1: Afficher une erreur simple

```jsx
import ErrorAlert from "../components/ErrorAlert/ErrorAlert";
import { parseErrorMessage } from "../utils/errorParser";

export default function MyPage() {
  const [error, setError] = useState("");

  return (
    <div>
      {error && (
        <ErrorAlert
          errors={parseErrorMessage(error)}
          onDismiss={() => setError("")}
        />
      )}

      {/* Votre contenu */}
    </div>
  );
}
```

### Cas 2: Afficher plusieurs erreurs

```jsx
// Les erreurs multiples sont automatiquement détectées
// et affichées comme une liste verticale

const [error, setError] = useState("");

try {
  await submitForm();
} catch (err) {
  // Si err.response.data.errors = { field1: [...], field2: [...] }
  // ErrorAlert affichera automatiquement une liste bien formatée
  setError(err);
}
```

### Cas 3: Afficher un message de succès

```jsx
import SuccessAlert from "../components/SuccessAlert/SuccessAlert";

export default function MyPage() {
  const [success, setSuccess] = useState("");

  return (
    <div>
      {success && (
        <SuccessAlert message={success} onDismiss={() => setSuccess("")} />
      )}
    </div>
  );
}
```

## 🔍 Formats d'erreurs gérées

### Format 1: String simple

```javascript
setError("Un problème est survenu");
// ✅ Affiche: | Un problème est survenu |
```

### Format 2: Array de strings

```javascript
setError(["Erreur 1", "Erreur 2", "Erreur 3"]);
// ✅ Affiche:
// • Erreur 1
// • Erreur 2
// • Erreur 3
```

### Format 3: Erreur Axios (Laravel)

```javascript
try {
  await api.post("/submit", data);
} catch (err) {
  // err.response.data = {
  //   message: 'Validation failed',
  //   errors: {
  //     email: ['Email is required'],
  //     password: ['Password must be at least 8 chars']
  //   }
  // }
  setError(err);
  // ✅ Affiche:
  // • Email is required
  // • Password must be at least 8 chars
}
```

### Format 4: Erreur d'API simple

```javascript
try {
  await api.get("/data");
} catch (err) {
  // err.response.data = { message: 'Not found' }
  setError(err);
  // ✅ Affiche: | Not found |
}
```

## 🎨 Personnalisation (optionnel)

Si vous voulez personnaliser les couleurs, modifiez les CSS:

### ErrorAlert.css

```css
.error-alert {
  /* Votre gradient couleur */
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border: 1px solid #f5a5a5;
}
```

### SuccessAlert.css

```css
.success-alert {
  /* Votre gradient couleur */
  background: linear-gradient(135deg, #ecf8f3 0%, #e0f5ee 100%);
  border: 1px solid #81c784;
}
```

## 📋 Checklist de migration

Si vous migrez du vieux système:

- [ ] Importer ErrorAlert et SuccessAlert
- [ ] Importer parseErrorMessage
- [ ] Remplacer `{error && <p...>` par `{error && <ErrorAlert...>`
- [ ] Remplacer `{success && <p...>` par `{success && <SuccessAlert...>`
- [ ] Tester avec erreurs simples
- [ ] Tester avec erreurs multiples (validation)
- [ ] Tester le mode sombre
- [ ] Tester sur mobile

## 🧪 Scénarios de test

### Test 1: Erreur de connexion

1. Va à la page Login
2. Entre un email/password incorrect
3. Verifier: Erreur affichée en liste verticale rouge
4. Clique X: Erreur disparait

### Test 2: Erreurs de validation multiples

1. Va à "Nouveau courrier"
2. Essaye d'envoyer sans objet
3. Verifier: Plusieurs erreurs en liste
4. Clique X: Tous disparaissent

### Test 3: Mode sombre

1. Active le mode sombre
2. Trigger une erreur
3. Verifier: Couleurs adaptées au dark mode
4. Verifier: Bien lisible

### Test 4: Succès

1. Envoie un message valide
2. Verifier: Message vert avec ✓
3. Clique X: Disparait

### Test 5: Mobile

1. Ouvre sur mobile (responsive)
2. Verifier: Layout correct
3. Verifier: Texte lisible
4. Verifier: Bouton X accessible

## 🔧 Dépannage

### Problème: ErrorAlert ne s'affiche pas

**Solution**:

```jsx
// ❌ Mauvais
{
  error && <ErrorAlert errors={error} />;
}

// ✅ Correct
{
  error && <ErrorAlert errors={parseErrorMessage(error)} />;
}
```

### Problème: Message d'erreur coupé

**Solution**: Le composant ajuste automatiquement, mais vous pouvez ajuster le padding dans `ErrorAlert.css`

### Problème: Animation pas fluide

**Solution**: Vérifiez que les animations CSS sont activées dans vos paramètres du navigateur

## 💡 Bonnes pratiques

### 1. Toujours utiliser parseErrorMessage

```jsx
// ✅ Bon
{error && <ErrorAlert errors={parseErrorMessage(error)} ... />}

// ❌ Éviter
{error && <ErrorAlert errors={error} ... />}
```

### 2. Toujours fournir onDismiss

```jsx
// ✅ Bon
<ErrorAlert errors={...} onDismiss={() => setError('')} />

// ⚠️ Fonctionnera mais pas idéal
<ErrorAlert errors={...} />
```

### 3. Réinitialiser l'erreur avant une nouvelle requête

```jsx
// ✅ Bon
const handleSubmit = async () => {
  setError(""); // Reset d'abord
  try {
    await api.post("/data");
  } catch (err) {
    setError(err);
  }
};
```

### 4. Utiliser SuccessAlert pour les confirmations

```jsx
// ✅ Bon
const handleDelete = async (id) => {
  await api.delete(`/items/${id}`);
  setSuccess("Item supprimé avec succès");
};
```

## 🚀 Intégration rapide

Pour intégrer dans une nouvelle page:

```jsx
import React, { useState } from "react";
import ErrorAlert from "../components/ErrorAlert/ErrorAlert";
import SuccessAlert from "../components/SuccessAlert/SuccessAlert";
import { parseErrorMessage } from "../utils/errorParser";

export default function NewPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <div>
      {/* Affichage des alertes */}
      {error && (
        <ErrorAlert
          errors={parseErrorMessage(error)}
          onDismiss={() => setError("")}
        />
      )}
      {success && (
        <SuccessAlert message={success} onDismiss={() => setSuccess("")} />
      )}

      {/* Votre contenu */}
    </div>
  );
}
```

## 📞 Support

Pour toute question sur l'implémentation:

- Consultez les fichiers exemple dans les pages modifiées
- Vérifiez les imports dans chaque page
- Testez avec des cas d'erreur réels

---

**Dernière mise à jour**: 14 avril 2026
**Version**: 1.0 - Initial release
