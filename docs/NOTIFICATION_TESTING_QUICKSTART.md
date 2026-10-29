# 🚀 Guide de Démarrage Rapide - Système de Notifications

## ⚡ Démarrage en 5 minutes

### 1️⃣ Vérifier que le frontend fonctionne

```bash
cd /srv/http/courrier-management-pro/frontend-react
npm run dev
```

✅ À voir: Application React démarre sur http://localhost:5173

### 2️⃣ Vérifier que l'API fonctionne

```bash
cd /srv/http/courrier-management-pro/backend-laravel
php artisan serve
```

✅ À voir: API démarre sur http://localhost:8000

### 3️⃣ Ouvrir l'application

- Url: http://localhost:5173 (ou le port indiqué par Vite)
- ✅ À voir: Interface React avec la cloche 🔔 en haut à droite

---

## 🧪 Tests Rapides

### Test 1: Bell Icon et Badge

**Étapes:**

1. Regarder en haut à droite
2. Vous devriez voir 🔔 (cloche)

**Résultats attendus:**

- ✅ Cloche visible
- ✅ Badge rouge avec nombre (si non-lus)
- ✅ Badge pulse/animate

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Console → Erreurs?
- Vérifier que NotificationPanel.jsx est bien importé dans Navbar.jsx
- Vérifier que useUnreadMessages.js existe en /hooks/
```

---

### Test 2: Créer un nouveau courrier et voir la notification

**Étapes:**

1. Aller sur Admin/Dashboard ou Envoi de courrier
2. Créer un nouveau courrier ENTRANT (inbox)
   - Vous pouvez créer via une API call ou depuis le backend
3. Garder l'œil sur le coin supérieur droit

**Résultats attendus:**

- ✅ Toast rouge apparaît (coulissant depuis la droite)
- ✅ Toast montre "Nouveau courrier"
- ✅ Toast montre le nom de l'expéditeur
- ✅ Toast montre l'objet du courrier
- ✅ Badge dans la cloche augmente de 1
- ✅ Toast auto-disparaît après 8 secondes
- ✅ OU cliquer sur le toast pour le fermer

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Console → useUnreadMessages hook fonctionne?
- F12 → Network → fetchCourrierInbox appelée?
- F12 → Application → localStorage['readMessages'] existe?
- Vérifier que le courrier a bien un `id`
```

---

### Test 3: Cliquer sur la notification

**Étapes:**

1. Créer un nouveau courrier entrant (voir Test 2)
2. Attendre que le toast apparaisse
3. Cliquer sur le toast (avant qu'il auto-disparaisse)

**Résultats attendus:**

- ✅ Navigation vers `/courriers/entrants`
- ✅ Toast disparaît
- ✅ Page montre les courriers entrants
- ✅ Badge dans cloche revient à 0
- ✅ Aucun autre toast n'apparaît

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Console → useNavigate hook disponible?
- Vérifier que IncomingMessageToast.jsx a navigate import
- Vérifier que CourriersEntrants.jsx marque comme lus
```

---

### Test 4: Bell Panel (Dropdown)

**Étapes:**

1. Créer 2-3 nouveaux courriers
2. Cliquer sur la cloche 🔔
3. Regarder le dropdown

**Résultats attendus:**

- ✅ Dropdown s'ouvre
- ✅ Montre liste des courriers non-lus
- ✅ Chaque item montre: Expéditeur + Objet + Date
- ✅ Badge montre le count correct
- ✅ Cliquer sur un courrier → Navigation
- ✅ Bouton "Tout marquer comme lu" → Tous marqués
- ✅ Bouton "Voir tous les courriers" → Navigation entrants

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Console → NotificationPanel props bien passés?
- Vérifier unreadMessages array n'est pas vide
- Vérifier clic handlers sont bien définis
```

---

### Test 5: Auto-marquer comme lu

**Étapes:**

1. Créer 2 nouveaux courriers
2. Voir badge = 2
3. Aller sur page Courriers entrants
4. Attendre 1 sec

**Résultats attendus:**

- ✅ Badge revient à 0
- ✅ Toast disparaît
- ✅ localStorage['readMessages'] est mis à jour
- ✅ Recharger la page: Badge reste à 0

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Application → localStorage['readMessages'] mis à jour?
- Vérifier que CourriersEntrants appelle markMessageAsRead
- Vérifier l'événement refreshUnreadMessages est dispatché
```

---

### Test 6: Persistence (Rechargement page)

**Étapes:**

1. Créer 1 courrier
2. Voir badge = 1
3. Aller sur Courriers entrants
4. Badge = 0
5. Recharger la page (F5 ou Ctrl+R)

**Résultats attendus:**

- ✅ Badge reste = 0 (pas revient à 1)
- ✅ localStorage persiste les données

**Si ça ne marche pas:**

```
Vérifier:
- F12 → Application → localStorage visible?
- localStorage['readMessages'] contient les IDs?
- Vérifier useUnreadMessages récupère depuis localStorage
```

---

### Test 7: Mode Sombre

**Étapes:**

1. Activer mode sombre (dans l'app)
2. Créer un nouveau courrier
3. Regarder le toast
4. Ouvrir le bell panel

**Résultats attendus:**

- ✅ Toast: Fond rouge sombre, texte blanc/clair
- ✅ Panel: Fond gris sombre, texte blanc
- ✅ Badge: Remains rouge, visible
- ✅ Bien lisible, pas de problème de contraste

**Si ça ne marche pas:**

```
Vérifier:
- F12 → HTML → [data-theme="dark"] présent?
- CSS: NotificationPanel.css a les dark selectors?
- CSS: IncomingMessageToast.css a les dark selectors?
```

---

### Test 8: Mobile Responsive

**Étapes:**

1. Ouvrir DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Choisir iPhone/Mobile
4. Créer un nouveau courrier
5. Tester les interactions

**Résultats attendus:**

- ✅ Toast: Visible et lisible
- ✅ Cloche: Accessible (en haut)
- ✅ Panel: Responsive (adapté largeur)
- ✅ Text: Lisible, pas trop petit
- ✅ Clic: Fonctionne bien

**Si ça ne marche pas:**

```
Vérifier:
- CSS: Media queries présentes?
- IncomingMessageToast.css: Mobile sizing?
- NotificationPanel.css: Mobile position (left vs right)?
```

---

## 🐛 Dépannage Rapide

| Symptôme               | Cause                                    | Fix                                      |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| Cloche pas visible     | Navbar.jsx non intégré                   | Vérifier import NotificationPanel        |
| Badge vide             | unreadMessages hook not fetching         | Vérifier fetchCourrierInbox API          |
| Toast ne s'affiche pas | NotificationCenter non rendu dans Layout | Vérifier ligne 405 Layout.jsx            |
| Toast ne disparaît pas | Timeout non défini                       | Vérifier ligne 24 NotificationCenter.jsx |
| Dark mode mauvais      | CSS selectors manquants                  | Vérifier [data-theme="dark"] CSS         |
| Mobile cassé           | Media queries manquantes                 | Vérifier CSS pour breakpoints            |

---

## 🔍 Debug Avec la Console

```javascript
// Ouvrir F12 Console et copier:

// 1. Vérifier localStorage
console.log(localStorage.getItem("readMessages"));

// 2. Vérifier unread count
JSON.parse(localStorage.getItem("readMessages") || "[]").length;

// 3. Forcer un rafraîchissement
window.dispatchEvent(new Event("refreshUnreadMessages"));

// 4. Vérifier les courriers dans l'API
// Aller dans Network → Chercher "inbox" ou "courrierInbox"
```

---

## 📱 Checklist de Validation

- [ ] Cloche 🔔 visible en haut à droite?
- [ ] Badge montre count des non-lus?
- [ ] Toast apparaît pour nouveau courrier?
- [ ] Toast montre expéditeur + objet?
- [ ] Clic toast → Navigation fonctionne?
- [ ] Toast auto-disparaît après 8s?
- [ ] Bell panel affiche la liste?
- [ ] Mark all as read fonctionne?
- [ ] Persistence fonctionne (rechargement)?
- [ ] Dark mode look bon?
- [ ] Mobile responsive?

---

## 📞 Besoin d'aide?

### Console Errors?

```
1. Ouvrir F12 → Console
2. Reporter l'erreur complète
3. Vérifier que tous les imports sont corrects
```

### Nothing Works?

```
1. Vérifier que node_modules est à jour:
   npm install

2. Vérifier que le backend API fonctionne:
   curl http://localhost:8000/api/inbox

3. Vérifier que les fichiers existent:
   ls -la frontend-react/src/hooks/useUnreadMessages.js
```

### Features Partiellement Working?

```
1. Rafraîchir la page (Ctrl+Shift+R pour clear cache)
2. Clear localStorage: localStorage.clear()
3. Redémarrer le serveur npm
```

---

## 📈 Prochaines Étapes Après Validation

1. ✅ **Tests passent** → Documenter les résultats
2. ✅ **Tests passent** → Communiquer aux utilisateurs
3. ✅ **Tests passent** → Déployer en production
4. 🔄 **Tests échouent** → Debug avec cette checklist
5. 📝 **Tests échouent** → Documenter le problème

---

## 🎓 Ressources

- **Documentation Complète**: [NOTIFICATION_SYSTEM_GUIDE.md](NOTIFICATION_SYSTEM_GUIDE.md)
- **Résumé Implémentation**: [NOTIFICATION_SYSTEM_SUMMARY.md](NOTIFICATION_SYSTEM_SUMMARY.md)
- **Statut JSON**: [NOTIFICATION_SYSTEM_STATUS.json](NOTIFICATION_SYSTEM_STATUS.json)

---

**🚀 Prêt à tester! Bonne chance!**
