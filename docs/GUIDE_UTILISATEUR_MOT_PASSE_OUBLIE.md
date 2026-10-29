# 📱 GUIDE UTILISATEUR - RÉINITIALISER MON MOT DE PASSE

## 🎯 Comment ça Marche

Vous avez oublié votre mot de passe? Pas de problème! Voici comment réinitialiser:

---

## 📋 Scénario Complet (Pas à Pas)

### Phase 1️⃣: Demander le Code (5 minutes)

#### Étape 1: Aller sur la page de connexion

```
Allez sur: http://votre-site.com/login
```

#### Étape 2: Cliquer "Mot de passe oublié"

```
Sur la page login, cherchez le lien:
👉 "Mot de passe oublié?"
```

#### Étape 3: Entrer votre email

```
Formulaire:
├─ Email: votre@email.com
└─ Bouton: "Demander le code"
```

#### Étape 4: Confirmer que la demande est envoyée

```
Message affiché:
"Votre demande a été envoyée aux administrateurs actifs.
Un code de réinitialisation a été généré pour cet email."
✅ LA DEMANDE EST PARTIE
```

#### Résultat: L'administrateur reçoit

- 📬 Un courrier avec le code
- 🔔 Une notification

---

### Phase 2️⃣: Recevoir le Code (Variable - 5 min à quelques heures)

L'administrateur reçoit votre demande et vous transmet le code par:

- 📱 SMS
- 📞 Appel téléphonique
- 💬 Message interne
- 📧 Email
- Etc.

**Exemple de code reçu: `806517`**

---

### Phase 3️⃣: Entrer le Code (5 minutes)

#### Étape 1: Retourner sur la page de connexion

```
Allez sur: http://votre-site.com/login
```

#### Étape 2: Cliquer "Mot de passe oublié" AGAIN

```
👉 "Mot de passe oublié?"
```

#### Étape 3: Cliquer "J'ai un code"

```
Vous verrez deux formulaires:
1️⃣ "Demander le code" (première fois)
2️⃣ "J'ai un code" ← CLIQUEZ ICI

Le premier vous demande juste un email.
Le second vous demande: Email + Code
```

#### Étape 4: Remplir le formulaire

```
Formulaire "Vérifier le code":
├─ Email: votre@email.com
├─ Code reçu: 806517
└─ Bouton: "Vérifier le code"
```

#### Étape 5: Vérifier le code

```
Vous cliquez "Vérifier le code"

Si ✅ Code correct:
   "Code validé avec succès"
   ↓ Redirection vers page suivante

Si ❌ Code incorrect:
   "Code invalide ou expiré"
   Essayez de nouveau (ou demandez un nouveau code)
```

**Important:**

- Le code est sensible à la casse
- Le code doit être exact
- Le code expire après 15 minutes

---

### Phase 4️⃣: Créer le Nouveau Mot de Passe (5 minutes)

#### Étape 1: Page "Nouveau Mot de Passe"

```
Après vérification du code, vous êtes redirigé vers:
"Créer un nouveau mot de passe"
```

#### Étape 2: Remplir les champs

```
Formulaire:
├─ Nouveau mot de passe: [________]
├─ Confirmation: [________]
└─ Bouton: "Réinitialiser"

⚠️ IMPORTANT:
Les deux champs doivent être IDENTIQUES
```

#### Étape 3: Choisir un bon mot de passe

```
Minimum 8 caractères
Recommandé:
├─ Majuscules (A-Z)
├─ Miniscules (a-z)
├─ Chiffres (0-9)
└─ Caractères spéciaux (!@#$%...)

❌ MAUVAIS: password123
✅ BON: MyP@ssw0rd123!
```

#### Étape 4: Confirmer le mot de passe

```
Entrez le MÊME mot de passe dans les deux champs

Exemple:
├─ Nouveau mot de passe: MyP@ssw0rd123!
├─ Confirmation: MyP@ssw0rd123!
└─ Les deux correspondent? ✅ OUI
```

#### Étape 5: Cliquer "Réinitialiser"

```
Vous cliquez sur "Réinitialiser"

Message affiché:
"Mot de passe réinitialisé avec succès"

Ancien mot de passe: ❌ NE FONCTIONNE PLUS
Nouveau mot de passe: ✅ FONCTIONNE
```

---

### Phase 5️⃣: Se Reconnecter (1 minute)

#### Étape 1: Retourner à la page de connexion

```
Vous êtes redirigé automatiquement vers:
Login Page
```

#### Étape 2: Entrer vos identifiants

```
Formulaire de connexion:
├─ Email: votre@email.com
├─ Mot de passe: MyP@ssw0rd123! (LE NOUVEAU)
└─ Bouton: "Se connecter"
```

#### Étape 3: Connexion réussie

```
✅ "Connexion réussie"
✅ Vous êtes maintenant connecté
✅ Accès à votre compte
```

---

## ⚡ Résumé Rapide

```
┌─────────────────────────────────────┐
│ 5 Étapes pour Réinitialiser         │
├─────────────────────────────────────┤
│ 1️⃣  Clique "Mot de passe oublié"   │
│ 2️⃣  Entre votre email              │
│ 3️⃣  Demande le code                │
│ 4️⃣  Attends le code de l'admin     │
│ 5️⃣  Rentre le code                 │
│ 6️⃣  Saisit nouveau mot de passe    │
│ 7️⃣  Se reconnecte                  │
└─────────────────────────────────────┘
```

---

## ⚠️ Important à Savoir

### Le Code

- **Durée de validité**: 15 minutes
- **Transmis par**: L'administrateur (SMS/appel/etc)
- **Ne peut être utilisé qu'une fois**
- **Expire automatiquement**

### Le Mot de Passe

- **Ancien mot de passe**: N'est plus valide après réinitialisation
- **Nouveau mot de passe**: Doit être saisi deux fois (confirmation)
- **Les deux champs doivent correspondre exactement**
- **Minimum 8 caractères recommandé**
- **Utilisez des majuscules, minuscules, chiffres, symboles**

### Sécurité

- ✅ Votre nouveau mot de passe est stocké de manière sécurisée (hashé)
- ✅ Personne ne peut voir votre mot de passe
- ✅ Le code est valide seulement pour vous
- ✅ Après utilisation, le code ne peut pas être réutilisé

---

## 🆘 Problèmes Courants

### Problème 1: "Code invalide ou expiré"

**Causes possibles:**

- ❌ Vous avez saisi le mauvais code
- ❌ Le code a expiré (plus de 15 minutes)
- ❌ Le code a déjà été utilisé

**Solutions:**

1. Vérifiez que vous avez le bon code
2. Si > 15 minutes, demandez un NOUVEAU code
3. Recommencez le processus

### Problème 2: "Les mots de passe ne correspondent pas"

**Cause:**

- ❌ Les deux champs ne sont pas identiques

**Solution:**

1. Vérifiez l'orthographe
2. Vérifiez les majuscules/minuscules
3. Ressaisissez exécutement le même mot de passe

### Problème 3: "Mot de passe trop court"

**Cause:**

- ❌ Moins de 8 caractères

**Solution:**

1. Utilisez au moins 8 caractères
2. Exemple: MyP@ss123 (9 caractères) ✅

### Problème 4: "Je n'ai pas reçu le code de l'admin"

**Causes possibles:**

- ❌ L'admin n'a pas vu la notification
- ❌ Le message s'est perdu
- ❌ Délai d'attente

**Solutions:**

1. Attendez quelques minutes
2. Contactez directement l'administrateur
3. Demandez un NOUVEAU code

---

## ✅ Vérification

Après réinitialisation:

- [x] Je peux me connecter avec le NOUVEAU mot de passe
- [x] L'ANCIEN mot de passe ne fonctionne plus
- [x] Je suis accédé à mon compte
- [x] Ma session est active

---

## 📞 Besoin d'Aide?

Si vous rencontrez des problèmes:

1. **Relisez ce guide** (section "Problèmes Courants")
2. **Contactez votre administrateur**
3. **Décrivez le problème exactement**

Informations utiles à donner:

- ✅ Votre email
- ✅ Le message d'erreur exact
- ✅ À quelle étape vous êtes bloqué

---

## 🎉 Résumé

Le processus est simple:

1. Demandez le code ← Utilise l'email
2. Recevez le code ← De l'administrateur
3. Entrez le code ← Vérification
4. Saisissez nouveau mot de passe ← Avec confirmation
5. Reconnectez-vous ← Avec le nouveau mot de passe

**Tout fonctionne automatiquement et en sécurité! ✅**

---

## 🔐 Sécurité Assurée

- ✅ Code unique pour chaque demande
- ✅ Code expire automatiquement
- ✅ Code ne peut être utilisé qu'une fois
- ✅ Mot de passe hashé en base de données
- ✅ Pas de stockage du mot de passe en clair
- ✅ Sessions anciennes invalidées après reset

**Votre compte est sécurisé! 🔒**
