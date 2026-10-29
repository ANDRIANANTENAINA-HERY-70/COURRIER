# 🔔 Système de Notifications Automatiques - Documentation

## 📋 Vue d'ensemble

Un système complet de notifications automatiques a été implémenté pour afficher les courriers entrants en temps réel. Les utilisateurs recevront des notifications visuelles quand de nouveaux courriers arrivent et pourront naviguer directement vers le courrier concerné.

## 🎯 Fonctionnalités

### 1. **Panel de Notifications en temps réel**

- Visible dans la barre de navigation (cloche 🔔)
- Badge avec le nombre de notifications non-lues
- Animation de pulsation du badge
- Liste déroulante avec tous les courriers non-lus

### 2. **Toast Notifications**

- Notification toast qui apparait automatiquement pour chaque nouveau courrier
- Affiche le nom de l'expéditeur et l'objet du courrier
- Clic sur le toast → navigation vers le courrier
- Désapparat après 8 secondes (ou au clic de X)

### 3. **Marquage automatique comme Lu**

- Tous les courriers sont automatiquement marqués comme lus quand on visite la page "Courriers entrants"
- Les notifications disparaissent après consultation

### 4. **Auto-rafraîchissement**

- Vérification des courriers non-lus toutes les 30 secondes
- Rafraîchissement immédiat quand la page redevient visible
- Support des événements personnalisés pour rafraîchissement manuel

## 🏗️ Architecture

### Fichiers créés

```
frontend-react/src/
├── hooks/
│   └── useUnreadMessages.js             # Hook principal des notifications
├── components/
│   ├── NotificationPanel/
│   │   ├── NotificationPanel.jsx        # Panneau de notifications (cloche)
│   │   └── NotificationPanel.css
│   ├── NotificationCenter/
│   │   ├── NotificationCenter.jsx       # Gestionnaire des toasts
│   │   └── NotificationCenter.css
│   └── IncomingMessageToast/
│       ├── IncomingMessageToast.jsx     # Toast individuel
│       └── IncomingMessageToast.css
```

### Fichiers modifiés

```
frontend-react/src/
├── components/Layout/
│   └── Navbar.jsx                       # Intégration du NotificationPanel
│   └── Layout.jsx                       # Intégration du NotificationCenter
└── pages/
    └── CourriersEntrants.jsx             # Marquage auto comme lu
```

## 🔌 Hook: useUnreadMessages

### Utilisation

```jsx
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function MyComponent() {
  const {
    unreadMessages, // Array des courriers non-lus
    count, // Nombre total de non-lus
    markAsRead, // Fonction pour marquer 1 comme lu
    clearAll, // Fonction pour marquer tous comme lus
    refreshUnread, // Fonction pour rafraîchir la liste
    loading, // État de chargement
    error, // Erreur éventuelle
  } = useUnreadMessages();

  return <div>Vous avez {count} notifications non-lues</div>;
}
```

### Fonctionnement interne

1. **Récupération des courriers**
   - Appelle `fetchCourrierInbox()` pour récupérer les courriers entrants
   - Filtre les courriers non-lus (via localStorage)
   - Filtre les courriers archivés

2. **Persistence des lus**
   - Stocke les IDs des courriers lus dans localStorage: `readMessages`
   - Array JSON des IDs

3. **Auto-rafraîchissement**
   - Vérification toutes les 30 secondes
   - Rafraîchissement immédiat si `document.visibilityState === 'visible'`
   - Écoute l'événement `refreshUnreadMessages`

## 🎨 Composants visuels

### NotificationPanel (Cloche 🔔)

```
┌─────────────────────────────────┐
│ 🔔 [3] ← Badge avec count       │
│  ↓                              │
│  ┌─────────────────────────────┐│
│  │ Notifications           [×] ││
│  ├─────────────────────────────┤│
│  │ ⚠️ Novo Courrier         • ││
│  │    De: Alice             │ ││
│  │    "Urgent: Rapport"     │ ││
│  │    14/04 10:30           │ ││
│  ├─────────────────────────────┤│
│  │ ⚠️ Novo Courrier         • ││
│  │    De: Bob               │ ││
│  │    "Réunion reportée"    │ ││
│  │    14/04 09:15           │ ││
│  ├─────────────────────────────┤│
│  │ [Tout marquer comme lu]  ││
│  │ [Voir tous les courriers]││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### IncomingMessageToast

```
┌────────────────────────────────────────────┐
│ ⚠️ │                            → │ [×]    │
│    │ Nouveau courrier!                     │
│    │ De: Alice Dupont                     │
│    │ "Dossier à réviser"                  │
└────────────────────────────────────────────┘
(Cliquable → Navigate vers CourriersEntrants)
```

## 🔄 Flux de travail

### Quand un nouveau courrier arrive:

```
1. Backend enregistre le courrier
   ↓
2. Frontend rafraîchit la liste (toutes les 30s  ou sur visibilité)
   ↓
3. useUnreadMessages détecte le nouveau courrier
   ↓
4. NotificationCenter crée un toast
   ↓
5. Toast s'affiche (8s ou jusqu'au clic)
   ↓
6. Badge dans la cloche se met à jour
```

### Quand l'utilisateur clique sur une notification:

```
1. Clic sur toast
   ↓
2. Navigation vers /courriers/entrants
   ↓
3. CourriersEntrants charge les courriers
   ↓
4. Tous les courriers sont marqués comme lus
   ↓
5. useUnreadMessages se rafraîchit
   ↓
6. Notifications disparaissent
```

## 📊 Stockage des données

### localStorage: `readMessages`

```javascript
// Format: Array d'IDs de courriers lus
["1", "5", "12", "23"];
```

### Workflow:

1. Au chargement, récupère `readMessages` du localStorage
2. Lors de `markAsRead(id)`, ajoute l'ID à l'array
3. Filtre les courriers pour ne montrer que ceux dont l'ID n'est pas dans `readMessages`

## 🎯 Intégration

### Dans Navbar.jsx

```jsx
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import NotificationPanel from "../NotificationPanel/NotificationPanel";

export default function Navbar() {
  const { unreadMessages, markAsRead, clearAll } = useUnreadMessages();

  return (
    <NotificationPanel
      unreadMessages={unreadMessages}
      onMarkAsRead={markAsRead}
      onClearAll={clearAll}
    />
  );
}
```

### Dans Layout.jsx

```jsx
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import NotificationCenter from "../NotificationCenter/NotificationCenter";

export default function Layout() {
  const { unreadMessages } = useUnreadMessages();

  return (
    <>
      <Layout />
      <NotificationCenter unreadMessages={unreadMessages} />
    </>
  );
}
```

### Dans CourriersEntrants.jsx

```jsx
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function CourriersEntrants() {
  const { markMessageAsRead } = useUnreadMessages();

  useEffect(() => {
    // Marquer tous comme lus
    data.forEach((courrier) => {
      markMessageAsRead(courrier.id);
    });
  }, []);
}
```

## ⚙️ Configuration

### Auto-rafraîchissement

- Intervalle: 30 secondes
- Configurable en modifiant `useUnreadMessages.js` ligne ~51

### Durée du toast

- Durée: 8 secondes
- Configurable en modifiant `NotificationCenter.jsx` ligne ~24

### Persévérance des notifications

- Basée sur localStorage
- Persiste après rechargement de la page (sauf clearing du localStorage)

## 🌙 Support du mode sombre

- ✅ NotificationPanel: Couleurs adaptées
- ✅ NotificationCenter: Couleurs adaptées
- ✅ IncomingMessageToast: Couleurs adaptées (gradient rouge sombre)
- ✅ Tous les composants avec `[data-theme="dark"]`

## 📱 Responsivité

- ✅ Mobile (320px+): Layout ajusté
- ✅ Tablet (768px+): Layout normal
- ✅ Desktop (1024px+): Layout complet

### Particularités mobiles:

- NotificationPanel s'affiche à gauche sur mobile
- Toast centered sur l'écran
- Padding réduit

## 🧪 Scénarios de test

### Test 1: Nouvelles notifications arrivent

1. Ouvrir deux onglets: Page 1 et Courriers entrants
2. Envoyer un courrier depuis le backend /admin
3. Vérifier: Toast apparait dans onglet 1
4. Vérifier: Badge dans cloche se met à jour
5. Vérifier: Onglet 2 se rafraîchit automatiquement

### Test 2: Clic sur notification

1. Toast s'affiche pour nouveau courrier
2. Cliquer sur le toast
3. Vérifier: Navigation vers Courriers entrants
4. Vérifier: Courrier bien visible
5. Vérifier: Toast disparait (marqué comme lu)

### Test 3: Marquage comme lu

1. Voir 2 courriers non-lus
2. Accéder à Courriers entrants
3. Vérifier: Badge devient 0
4. Vérifier: Panel est vide
5. Recharger la page
6. Vérifier: Toujours à 0 (persistant)

### Test 4: Mode sombre

1. Activer mode sombre
2. Toast apparait
3. Vérifier: Couleurs sensles (sombre)
4. Panel notification: Vérifier couleurs
5. Vérifier: Bien lisible

### Test 5: Mobile

1. Ouvrir sur mobile
2. Toast s'affiche bien centré
3. Cloche accessible
4. Panel s'affiche correctement
5. Clic navig et fonctionne

## 🐛 Dépannage

### Notifications ne s'affichent pas

1. Vérifier la console: Pas d'erreur?
2. Vérifier localStorage: `readMessages` existe?
3. Vérifier API: fetchCourrierInbox marche?
4. Vérifier refreshUnreadMessages est appelé

### Badge reste à 0 malgré nouveaux courriers

1. Vérifier: Les courriers ont un ID?
2. Vérifier: markMessageAsRead est appelé?
3. Vérifier localStorage: IDs bien présents?
4. Rafraîchir la page (Ctrl+F5) pour reset

### Toast ne disparait pas après 8s

1. Vérifier: NotificationCenter.jsx timeout?
2. Vérifier: removeToast est appelé?
3. Vérifier: CSS animation complète?

## 📝 Checklist de maintenance

- [ ] Nettoyer localStorage periodiquement (removeOldUnreadMessages)
- [ ] Tester sur tous les navigateurs
- [ ] Vérifier performance avec 100+ notifications
- [ ] Monitoring de l'usage du localStorage

## 🚀 Améliorations futures

1. **Backend support**
   - Ajouter colonne `is_read` dans table `courriers`
   - Utiliser API pour persist des lus
   - Invalider le localStorage

2. **Settings utilisateur**
   - Permettre désactiver les notifications
   - Configurer la fréquence de refresh
   - Durée du toast configurable

3. **Sons et vibrations**
   - Son de notification (optional)
   - Vibration on mobile (si permis)

4. **WebSocket/SSE**
   - Real-time notifications (au lieu de polling)
   - Notifications pour les autres types d'événements

## 📞 Support

Pour toute question:

- Consultez ce fichier
- Vérifiez les fichiers source avec les commentaires
- Testez dans la console du navigateur
