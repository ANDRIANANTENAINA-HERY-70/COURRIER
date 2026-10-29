# React Frontend - Complete Exploration Report

**Date**: 18 MAI 2026  
**Framework**: React 19.2 + React Router 7.13 + Redux Toolkit  
**UI**: Tailwind CSS 4.0 + Framer Motion + Feather Icons

---

## 📊 IMPLEMENTATION STATUS SUMMARY

| Feature           | Component             | API Integration           | Status       | Notes                             |
| ----------------- | --------------------- | ------------------------- | ------------ | --------------------------------- |
| **Dashboard**     | Dashboard.jsx         | `/statistiques`           | ✅ Partial   | Mock data in demo mode            |
| **Inbox**         | CourriersEntrants.jsx | `/courriers/inbox`        | ✅ Full      | Complete + search/filter/paginate |
| **Sent**          | CourriersSortants.jsx | `/courriers` (POST)       | ✅ Full      | File upload working               |
| **Archives**      | Archives.jsx          | ❌ None                   | ⚠️ Mock only | 100% local data generation        |
| **Statistics**    | Statistiques.jsx      | `/statistiques`           | ⚠️ Mock      | Backend endpoint optional         |
| **Users**         | Utilisateurs.jsx      | ❌ None                   | ⚠️ Mock only | 100% local data generation        |
| **Messages**      | Messagerie.jsx        | `/messages`, `/courriers` | ✅ Partial   | Compose + list, no detail view    |
| **Notifications** | Notifications.jsx     | `/api/notifications`      | ⚠️ Partial   | Limited backend support           |
| **Settings/Help** | Parametres.jsx        | None                      | ✅ Info only | Help cards only                   |
| **Profile**       | Profil.jsx            | None                      | ✅ Local     | Avatar/name in localStorage       |
| **Admin Panel**   | AccountRequests.jsx   | `/register-requests`      | ✅ Full      | Approve/reject accounts           |
| **Login**         | Login.jsx             | `/login`                  | ❌ Blocked   | Hard-coded demo mode              |

---

## 🗂️ DIRECTORY STRUCTURE

```
frontend-react/src/
├── pages/                           # 15 page components
│   ├── Dashboard.jsx               ✅ Home dashboard
│   ├── CourriersEntrants.jsx       ✅ Inbox
│   ├── CourriersSortants.jsx       ✅ Sent
│   ├── Archives.jsx                ⚠️  Stub (mock data)
│   ├── Messagerie.jsx              ⚠️  Partial features
│   ├── Statistiques.jsx            ⚠️  Mock data
│   ├── Utilisateurs.jsx            ❌ Mock only (no API)
│   ├── Parametres.jsx              ✅ Help page
│   ├── Profil.jsx                  ✅ User profile
│   ├── Notifications.jsx           ⚠️  Incomplete
│   ├── AccountRequests.jsx         ✅ Admin only
│   ├── Login.jsx                   ❌ Demo mode issue
│   ├── ForgotPassword.jsx
│   ├── ForgotPasswordCode.jsx
│   ├── ResetPassword.jsx
│   └── Nouvelle.jsx                ❌ Stub (empty)
│
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx              ✅ Main wrapper
│   │   ├── Sidebar.jsx             ✅ Navigation sidebar
│   │   ├── Navbar.jsx              ✅ Top bar
│   │
│   ├── Auth/
│   │   ├── PrivateRoute.jsx        ✅ Protected routes
│   │
│   ├── DocumentPreview/            ✅ File preview
│   ├── ErrorAlert/                 ✅ Error messages
│   ├── SuccessAlert/               ✅ Success messages
│   ├── NotificationCenter/         ⚠️  Toast notifications
│   └── IncomingMessageToast/       ✅ Message alerts
│
├── services/
│   └── api.js                      ✅ Axios + interceptors + helpers
│
├── store/
│   ├── index.js                    ✅ Redux configuration
│   └── slices/
│       ├── authSlice.js            ✅ Login/logout/register
│       └── couriersSlice.js        ✅ Messages state
│
├── styles/
│   └── global.css
│
├── hooks/                          📁 (assumed utilities)
├── utils/                          📁 (assumed utilities)
└── assets/                         📁 (images/icons)
```

---

## 🔌 ROUTING & NAVIGATION

### Route Configuration (App.jsx)

```
/login                      → Login page (public)
/                           → Dashboard (protected)
├── /courriers/entrants     → Inbox (CourriersEntrants)
├── /courriers/sortants     → Sent messages (CourriersSortants)
├── /courriers/archives     → Archive (Archives)
├── /messagerie             → Private messages (Messagerie)
├── /statistiques           → Analytics (Statistiques)
├── /utilisateurs           → User directory (Utilisateurs)
├── /parametres             → Settings/Help (Parametres)
├── /profil                 → User profile (Profil)
└── /admin-only             → [Would be AccountRequests]
```

### Sidebar Menu (Sidebar.jsx)

1. Tableau de bord (Dashboard)
2. Courriers entrants (Inbox)
3. Courriers sortants (Sent)
4. Archives
5. Messagerie (Messages)
6. Statistiques
7. Utilisateurs (Users)
8. Paramètres (Settings)

**Note**: Menu is role-filtered in Layout.jsx but not consistently applied in Sidebar.jsx

---

## 📱 PAGES DEEP DIVE

### 1. DASHBOARD (Dashboard.jsx - ~200 lines)

**Purpose**: Home/overview page with summary statistics

**API Endpoints Used**:

- `GET /statistiques` - Fetch dashboard stats

**Features Implemented**:
✅ 6 stat cards (Entrants, Sortants, Total, Archives, En Attente, Urgents)
✅ Recent courriers list (hardcoded mock)
✅ Activity timeline (hardcoded mock)
✅ Selected courrier modal view
✅ Dark mode compatible

**Data Source**:

```javascript
// Demo mode: Shows these hardcoded values
stats: {
  entrants: 0,
  sortants: 0,
  total: 0,
  archives: 0,
  enAttente: 0,
  urgents: 0
}
// Real mode: Fetches from /statistiques
```

**Remaining Mock Elements**:

- `recentCourriers` array (5 hardcoded samples)
- `activities` array (dynamic rendering but no real data)

**Issues**:
⚠️ When demo-token is set, stats always show 0
⚠️ Mock courriers and activities never update from API

**Files**:

- [Dashboard.jsx](frontend-react/src/pages/Dashboard.jsx)
- [Dashboard.css](frontend-react/src/pages/Dashboard.css)

---

### 2. INBOX (CourriersEntrants.jsx - ~350 lines)

**Purpose**: View received messages/courriers

**API Endpoints Used**:

- `GET /courriers/inbox` - Fetch incoming messages
- `PUT /messages/{id}/read` - Mark as read (partial feature)

**Features Implemented**:
✅ Fetch and display courriers list
✅ Search by objet/sender (real-time)
✅ Filters: Date range (from/to), Service dropdown
✅ Pagination: 10 items per page (Previous/Next buttons)
✅ Click to view modal with full message details
✅ Edit/Delete/Archive buttons per message (UI only)
✅ Priority/Status badges with colors
✅ Viewed/unread indicators
✅ Error handling + loading spinner

**Data Normalization**:

```javascript
const normalizeFromApi = (item) => ({
  id: item.id,
  reference: item.reference || `CR-${item.id}`,
  objet: item.objet || "",
  expediteur: item.sender?.name || item.sender?.email || "Expéditeur",
  destinataire: item.receiver?.name || item.receiver?.email || "",
  dateReception: item.created_at || new Date().toISOString(),
  priorite: item.priorite || "normale",
  statut: item.statut || "en_attente",
  // + more fields
});
```

**Filter Logic**:

- Searches across: objet, expediteur, reference
- Date filters: between dateDebut and dateFin (if provided)
- Service filter: exact match

**Issues**:
⚠️ Pagination resets on every search (expected behavior)
⚠️ Modal actions (Edit/Delete) are UI stubs - no backend calls

**Files**:

- [CourriersEntrants.jsx](frontend-react/src/pages/CourriersEntrants.jsx)
- [Courriers.css](frontend-react/src/pages/Courriers.css) (shared with Sent)

---

### 3. SENT (CourriersSortants.jsx - ~400 lines)

**Purpose**: View sent messages + compose new

**API Endpoints Used**:

- `GET /courriers/sent` - Fetch sent messages
- `POST /courriers` - Send new courrier
- `POST /courriers` (multipart) - Send with file attachment
- `GET /users` - Fetch recipient list

**Features Implemented**:
✅ Compose form (inline, appears on page)

- Receiver dropdown (from API `/users`)
- Subject (objet)
- Body text (message)
- File attachment input (5MB limit, restricted MIME types)
  ✅ Send message with or without file
  ✅ Display sent messages list (10 items/page)
  ✅ Search sent messages
  ✅ View modal for each message
  ✅ Success/error notifications
  ✅ Demo mode: Uses hardcoded user list (11 accounts)

**Hardcoded Demo Users**:

```javascript
demoUsers = [
  { id: "admin@example.com", name: "Admin Démo", email: "admin@example.com" },
  { id: "autre@example.com", name: "Autre Démo", email: "autre@example.com" },
  // + 9 more...
];
```

**Form Handling**:

```javascript
compose: {
  receiver_id: '',
  receiver_email: '',
  objet: '',
  message: '',
  fichier: null  // File object
}
```

**File Upload Logic**:

```javascript
const sendCourrierWithFile = ({ objet, message, receiver_id, fichier }) => {
  const formData = new FormData();
  formData.append("objet", objet);
  formData.append("message", message);
  formData.append("receiver_id", receiver_id);
  if (fichier) formData.append("fichier", fichier);
  return api.post("/courriers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
```

**Issues**:
⚠️ Modal actions (Edit/Delete) not functional
⚠️ No file size validation before upload
⚠️ Demo mode still uses hardcoded users even if API users available

**Files**:

- [CourriersSortants.jsx](frontend-react/src/pages/CourriersSortants.jsx)
- [Courriers.css](frontend-react/src/pages/Courriers.css)

---

### 4. ARCHIVES (Archives.jsx - ~300 lines)

**Purpose**: View archived/old messages

**API Endpoints Used**:
❌ **NONE** - Completely mock data

**Features Implemented**:
⚠️ Generate 32 mock archive items on mount
⚠️ Search by reference/title/sender/cote
⚠️ Filters: Year (2021-2024), Type (Courrier/Facture/Contrat/Rapport/Devis)
⚠️ Pagination (8 items per page)
⚠️ View modal with "Download" button (UI only)
⚠️ Type-specific icons and colors

**Mock Data Generator**:

```javascript
const generateArchiveData = (count) => {
  // Generates count random archives with:
  // - reference (ARCH-YEAR-NNNN format)
  // - titre, type, date, taille, expediteur, cote, extension
  return Array.from({ length: count }, (_, i) => ({...}));
}
```

**Critical Issue**:
❌ **NOT INTEGRATED WITH BACKEND** - No `/courriers/archives` endpoint called
❌ Mock data regenerated on every page load
❌ No persistence

**Files**:

- [Archives.jsx](frontend-react/src/pages/Archives.jsx)
- [Archives.css](frontend-react/src/pages/Archives.css)

---

### 5. STATISTICS (Statistiques.jsx - ~250 lines)

**Purpose**: Analytics dashboard with charts/trends

**API Endpoints Used**:
⚠️ `GET /statistiques` - Endpoint exists but optional

**Features Implemented**:
✅ Period selector: Week, Month, Year
✅ Gets mock stats via `getMockStats(period)`
✅ Shows metrics: global stats + by month + by service + by priority
✅ Mock data structure includes:

- global: {total, entrants, sortants, archives, enAttente, urgents}
- parMois: [{mois, entrants, sortants, archives}, ...]
- parService: [{service, count}, ...]
- priorites: {basse, normale, urgente}

**Mock Data Example (Month view)**:

```javascript
global: { total: 1256, entrants: 89, sortants: 67, archives: 234, enAttente: 23, urgents: 12 }
parMois: [
  { mois: 'Jan', entrants: 65, sortants: 45, archives: 23 },
  { mois: 'Fév', entrants: 72, sortants: 52, archives: 28 },
  // ... 6 months
]
parService: [
  { service: 'Comptabilité', count: 820 },
  { service: 'RH', count: 640 },
  // ... 5 services
]
```

**Note about Backend**:

- Backend `/statistiques` endpoint exists
- Frontend shows mock data regardless
- Could be integrated but not priority

**Issues**:
⚠️ No actual charts rendered (data structure only)
⚠️ Frontend-only feature currently

**Files**:

- [Statistiques.jsx](frontend-react/src/pages/Statistiques.jsx)
- [Statistiques.css](frontend-react/src/pages/Statistiques.css)

---

### 6. USERS (Utilisateurs.jsx - ~350 lines)

**Purpose**: User directory/admin panel

**API Endpoints Used**:
❌ **NONE** - Completely mock data

**Features Implemented**:
⚠️ Generate 25 mock users on mount
⚠️ Search by name/email/service (real-time)
⚠️ Filter by role (admin/directeur/secretaire/agent)
⚠️ Pagination (8 items per page)
⚠️ User cards with:

- Avatar initial
- Name, email, role, service, status
- Last login date
- Number of courriers sent
  ✅ UI buttons (Edit/Delete/Lock) but no functionality

**Mock Data Generator**:

```javascript
const generateMockUsers = (count) => {
  const roles = ["admin", "directeur", "secretaire", "agent"];
  const services = [
    "Direction",
    "Comptabilité",
    "RH",
    "Commercial",
    "Informatique",
    "Juridique",
  ];
  // Generates count random users with fake names/emails
};
```

**Role Styling**:

- admin → role-admin (red badge)
- directeur → role-directeur (blue badge)
- secretaire → role-secretaire (green badge)
- agent → role-agent (gray badge)

**Critical Issues**:
❌ **ZERO API INTEGRATION**
❌ Mock data regenerated on every mount
❌ Edit/Delete/Lock buttons do nothing
❌ No actual user management possible

**Files**:

- [Utilisateurs.jsx](frontend-react/src/pages/Utilisateurs.jsx)
- [Utilisateurs.css](frontend-react/src/pages/Utilisateurs.css)

---

### 7. MESSAGES/MESSAGERIE (Messagerie.jsx - ~250 lines)

**Purpose**: Private messaging between users

**API Endpoints Used**:

- `GET /users` - Recipient list
- `GET /messages/received` - Inbox messages
- `GET /messages/sent` - Sent messages
- `POST /messages` - Send new message
- `PUT /messages/{id}/read` - Mark as read (optional)

**Features Implemented**:
✅ Tab interface: Inbox / Sent / Compose
✅ Compose form: Receiver dropdown + subject + body text
✅ Send message with success/error alerts
✅ Display inbox messages (received)
✅ Display sent messages
✅ Client-side security: Double-filter to prevent info leaks

- Filter inbox: `receiver_id === currentUser.id`
- Filter sent: `sender_id === currentUser.id`

**Differences from Courriers**:

- Simpler (no file attachments in Messages)
- Separate API endpoints (`/messages` vs `/courriers`)
- Private 1-to-1 communication intent

**Issues**:
⚠️ No message detail/conversation view
⚠️ No delete/archive functionality
⚠️ No read status indicators
⚠️ Not truly "messaging" - one-way post system

**Files**:

- [Messagerie.jsx](frontend-react/src/pages/Messagerie.jsx)
- [Messagerie.css](frontend-react/src/pages/Messagerie.css)

---

### 8. NOTIFICATIONS (Notifications.jsx - ~150 lines)

**Purpose**: System notifications + alerts

**API Endpoints Used**:

- `GET /api/notifications` - Fetch notifications
- `POST /api/notifications` - Create new
- `PATCH /api/notifications/{id}/read` - Mark read
- (DELETE implied but incomplete)

**Features Implemented**:
✅ Notifications list
✅ Form to create new notification with fields:

- title
- message
- type (reminder/alert/info)
- scheduled_at (datetime)
- priority (low/medium/high)
  ✅ Mark as read button
  ✅ Delete notification (with confirmation)
  ✅ Error handling + loading states

**Issues**:
⚠️ Backend endpoints not fully implemented
⚠️ UI styling missing (basic structure only)
⚠️ Not integrated with notification toast system
⚠️ No real-time updates

**Files**:

- [Notifications.jsx](frontend-react/src/pages/Notifications.jsx)
- [Notifications.css](frontend-react/src/pages/Notifications.css)

---

### 9. SETTINGS/HELP (Parametres.jsx - ~50 lines)

**Purpose**: Help/quick reference guide

**Features**:
✅ 6 help cards explaining:

1. Notifications bell and badges
2. Dark/Light mode toggle
3. Export/CSV download
4. User management (Edit/Delete/Lock)
5. Security & logout
6. Future preferences (language, signatures)

**Implementation**:

- Static help content
- No actual settings to configure
- Informational only

**Files**:

- [Parametres.jsx](frontend-react/src/pages/Parametres.jsx)

---

### 10. PROFILE (Profil.jsx - ~150 lines)

**Purpose**: User profile customization (avatar + name)

**Storage**: localStorage only (NOT synced to backend)

**Features**:
✅ Avatar upload:

- Click avatar to open file picker
- Reads image as base64 dataURL
- Stored in `localStorage.userAvatar`
  ✅ Name editing:
- Input field with current name
- Save button persists to `localStorage.userProfileName`
  ✅ Avatar removal button
  ✅ Events dispatched for Layout to listen:
- `avatar-updated`
- `user-name-updated`

**Issues**:
⚠️ Avatar stored as full base64 (memory inefficient)
⚠️ No server sync - data lost if localStorage cleared
⚠️ No profile picture endpoint to upload to backend

**Files**:

- [Profil.jsx](frontend-react/src/pages/Profil.jsx)
- [Profil.css](frontend-react/src/pages/Profil.css)

---

### 11. ADMIN - ACCOUNT REQUESTS (AccountRequests.jsx - ~200 lines)

**Purpose**: Admin approves/rejects user signup requests

**API Endpoints Used**:

- `GET /register-requests` - Fetch pending requests
- `POST /register-requests/{id}/approve` - Approve request
- `POST /register-requests/{id}/reject` - Reject request

**Access Control**:
✅ Role check: `currentUser.role === 'admin'` only
✅ Shows "Access Restricted" message for non-admins

**Features**:
✅ Display pending requests count
✅ Request cards with fields: Avatar, Name, Email, Service
✅ Approve button (green) - calls `/approve` endpoint
✅ Reject button (red) - calls `/reject` endpoint
✅ Loading states + error handling
✅ Refresh list after action

**Request Data Structure**:

```javascript
{
  id: request.id,
  name: req.name,
  email: req.email,
  service: req.service || 'Not specified',
  role: req.role || 'agent'
}
```

**Issues**: None - fully implemented

**Files**:

- [AccountRequests.jsx](frontend-react/src/pages/AccountRequests.jsx)
- [AccountRequests.css](frontend-react/src/pages/AccountRequests.css)

---

### 12. LOGIN (Login.jsx - ~400 lines)

**Purpose**: Authentication entry point

**API Endpoints Used**:

- `POST /login` - Authenticate user
- `POST /signup` - Direct signup
- `POST /register-request` - Request account (awaiting approval)
- `GET /register-requests` - Admin panel (see pending)
- `POST /register-requests/{id}/approve` - Admin approve
- `POST /register-requests/{id}/reject` - Admin reject

**🚨 CRITICAL ISSUE: HARD-CODED DEMO MODE**

**Hard-coded Test Accounts**:

```javascript
const demoUsers = {
  "admin@example.com": { role: "admin", name: "Admin Démo" },
  "autre@example.com": { role: "agent", name: "Utilisateur Démo" },
  "demo@example.com": { role: "directeur", name: "Directeur Démo" },
};

// On form submit:
if (formData.password === "password" && demoUsers[formData.email]) {
  // Bypass API call, use demo token
  const user = { email: formData.email, ...demoUsers[formData.email] };
  localStorage.setItem("token", "demo-token");
  localStorage.setItem("user", JSON.stringify(user));
  navigate("/");
}
```

**Features**:
✅ Login form (email + password)
✅ Signup panel with role selector (10 roles)
✅ Admin panel (separate login for admins) to approve/reject requests
✅ Error handling + loading states

**Signup Roles Available**:

- 👑 admin
- 🏢 Direction Générale (DG)
- 📑 Secrétariat Général (SG)
- 📬 Service de courrier (Lecture/Dispatching)
- 👨‍💼 RH (Ressources Humaines)
- 🧑‍💼 DRH (Direction des Ressources Humaines)
- 💰 Comptabilité / Finance
- 📊 Service technique / opérationnel
- 🔄 Circuit typique d'un courrier
- ❓ Autre

**Problems**:
❌ Demo mode prevents real API testing
❌ `demo-token` is hardcoded value
❌ Interceptor special-cases demo-token (won't logout)
❌ API `/login` never actually called with real accounts

**Files**:

- [Login.jsx](frontend-react/src/pages/Login.jsx)
- [Login.css](frontend-react/src/pages/Login.css)

---

### 13. PASSWORD RESET PAGES

These pages exist but not fully explored:

- [ForgotPassword.jsx](frontend-react/src/pages/ForgotPassword.jsx)
- [ForgotPasswordCode.jsx](frontend-react/src/pages/ForgotPasswordCode.jsx)
- [ResetPassword.jsx](frontend-react/src/pages/ResetPassword.jsx)

_Not routed in App.jsx - may be legacy_

---

## 🎨 LAYOUT & COMPONENTS

### Layout.jsx (Main Wrapper)

**Path**: [src/components/Layout/Layout.jsx](frontend-react/src/components/Layout/Layout.jsx)

**Structure**:

- Router outlet for child pages
- Holds: Sidebar + Navbar + content area
- Props: `darkMode`, `setDarkMode`

**Key Features**:
✅ Menu items filtered by user role
✅ Handles notification clicks (navigate to relevant page)
✅ User avatar/name listening to events
✅ Avatar click → user menu dropdown

**Menu Items** (Role-based):

```
Dashboard                 → ['admin', 'directeur', 'secretaire', 'agent', 'compta', 'rh']
Courriers entrants       → ['admin', 'directeur', 'secretaire', 'agent', 'compta', 'rh']
Courriers sortants       → ['admin', 'directeur', 'secretaire', 'agent']
Archives                 → ['admin', 'directeur', 'secretaire']
Statistiques             → ['admin', 'directeur', 'secretaire']
Utilisateurs             → ['admin']
Paramètres               → ['admin', 'directeur']
Messagerie               → All (no filter)
Profil                   → All (no filter)
```

**Notification System** (Hardcoded):

```javascript
const defaultNotifications = [
  {
    id: 1,
    message: "Nouveau courrier urgent",
    time: "5 min",
    read: false,
    roles: ["admin", "directeur", "secretaire"],
    link: "/courriers/entrants",
  },
  {
    id: 2,
    message: "Courrier #COU-2024-001 traité",
    time: "1 heure",
    read: false,
    roles: ["admin", "secretaire"],
    link: "/courriers/archives",
  },
  // ... 5 total
];
```

---

### Sidebar.jsx

**Path**: [src/components/Layout/Sidebar.jsx](frontend-react/src/components/Layout/Sidebar.jsx)

**Features**:
✅ Expandable/collapsible sidebar (280px/80px)
✅ Animated width transition (framer-motion)
✅ Menu items with icons
✅ Tooltips on hover when collapsed
✅ Notification badge (fixed "3")

**Active Link Highlighting**:

- Uses `location.pathname === item.path`
- Applies `active` class for styling

---

### Navbar.jsx

**Path**: [src/components/Layout/Navbar.jsx](frontend-react/src/components/Layout/Navbar.jsx)

**Features**:
✅ Welcome message: "Bienvenue, {user.name}"
✅ Dark/Light mode toggle button
✅ Notifications bell with badge "3"
✅ User profile icon with initial (first letter)

**Uses Redux**:

- `useSelector((state) => state.auth.user)` to get user info

---

### PrivateRoute.jsx

**Path**: [src/components/Auth/PrivateRoute.jsx](frontend-react/src/components/Auth/PrivateRoute.jsx)

**Logic**:

- Check if `token` exists in localStorage
- If missing: redirect to `/login`
- If exists: render protected pages

---

### Other Components

- **DocumentPreview** - File preview (implementation incomplete)
- **NotificationCenter** - Toast notifications
- **ErrorAlert** - Red error boxes
- **SuccessAlert** - Green success boxes
- **IncomingMessageToast** - Message notifications

---

## 🔐 REDUX STATE MANAGEMENT

**File**: [src/store/index.js](frontend-react/src/store/index.js)

```javascript
export const store = configureStore({
  reducer: {
    auth: authReducer,
    courriers: courrierReducer,
  },
});
```

### Auth Slice ([authSlice.js](frontend-react/src/store/slices/authSlice.js))

**Initial State**:

```javascript
{
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,
  infoMessage: null
}
```

**Async Thunks**:

1. `login(credentials)` - `POST /login`
   - Stores token + user to localStorage
2. `register(userData)` - `POST /register-request`
   - Signup request (pending approval)
3. `logout()` - `POST /logout`
   - Clears localStorage
4. `fetchUser()` - `GET /user`
   - Refresh current user profile

**Reducers**:

- `clearError()` - Clear error message

---

### Courriers Slice ([couriersSlice.js](frontend-react/src/store/slices/couriersSlice.js))

**Purpose**: Manage courriers/messages state (if used)

_Note: Individual pages use local `useState` instead of Redux_

---

## 🌐 API CONFIGURATION

**File**: [src/services/api.js](frontend-react/src/services/api.js)

**Base URL**: `http://localhost:8000/api` (or `VITE_API_URL` env var)

**Request Interceptor** (adds Bearer token):

```javascript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Response Interceptor** (handles 401):

```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      // Special case: don't logout if demo-token
      if (token !== "demo-token") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
```

**Helper Functions Exported**:

```javascript
// Auth
export const login = (email, password) => api.post('/login', { email, password });
export const registerRequest = (data) => api.post('/register-request', data);
export const registerDirect = (data) => api.post('/signup', data);

// Admin
export const fetchPendingRequests = () => api.get('/register-requests');
export const approveRequest = (id) => api.post(`/register-requests/${id}/approve`);
export const rejectRequest = (id) => api.post(`/register-requests/${id}/reject`);

// Private Messages
export const sendMessage = (data) => api.post('/messages', data);
export const fetchInbox = () => api.get('/messages/received');
export const fetchSent = () => api.get('/messages/sent');
export const markMessageRead = (id) => api.put(`/messages/${id}/read`);

// Users
export const fetchUsers = () => api.get('/users');

// Courriers
export const sendCourrier = (data) => api.post('/courriers', data);
export const fetchCourrierInbox = () => api.get('/courriers/inbox');
export const fetchCourrierSent = () => api.get('/courriers/sent');
export const sendCourrierWithFile = ({objet, message, receiver_id, fichier}) => {...};
export const uploadCourrierAttachment = (courrierId, file) => {...};

// Stats
export const fetchStatistiques = () => api.get('/statistiques');
```

---

## 🎨 STYLING & DESIGN

### Tailwind CSS Integration

- **Version**: 4.0
- **Config**: Via `vite.config.js`
- **Utilities**: Used throughout components
- **Dark Mode**: CSS class `.dark-mode` on body

### Custom CSS Classes

**Common patterns** (from page CSS files):

- `.page-content` - Main page wrapper
- `.page-header` - Title + description section
- `.modern-card` - Reusable card container
- `.page-card` - Full-width page card
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button styles
- `.badge` - Small label badges
- `.loading` - Loading spinner
- `.error-banner` - Error message box

### Animations

**Library**: Framer Motion 12.35
**Common patterns**:

```javascript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>
  {content}
</motion.div>

<AnimatePresence mode="wait">
  <Routes>
    {/* page routes with motion */}
  </Routes>
</AnimatePresence>
```

### Icons

**Library**: react-icons/fi (Feather icons)
**Common icons used**:

- FiHome, FiInbox, FiSend, FiArchive - Navigation
- FiBell - Notifications
- FiSearch - Search
- FiFilter - Filters
- FiEdit2, FiTrash2, FiEye - Actions
- FiChevronLeft, FiChevronRight - Pagination
- FiMoon, FiSun - Dark mode
- FiUser, FiUsers - Profiles
- FiBarChart2 - Analytics

---

## 🔄 COMMON PATTERNS & CONVENTIONS

### Data Fetching Pattern

```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

useEffect(() => {
  setLoading(true);
  setError("");
  fetchData()
    .then((res) => setData(res.data.data || res.data || []))
    .catch((err) => setError(err.response?.data?.message || "Generic error"))
    .finally(() => setLoading(false));
}, [dependencies]);
```

### Form Handling Pattern

```javascript
const [form, setForm] = useState({ field1: "", field2: "" });

const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await api.post("/endpoint", form);
    // success
  } catch (err) {
    setError(err.response?.data?.message || "Error");
  }
};
```

### Pagination Pattern

```javascript
const itemsPerPage = 10;
const [currentPage, setCurrentPage] = useState(1);

const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
```

### Search/Filter Pattern

```javascript
const [searchTerm, setSearchTerm] = useState('');
const [filters, setFilters] = useState({...});

const filtered = data.filter(item => {
  const matchesSearch = item.field.includes(searchTerm.toLowerCase());
  const matchesFilter = filters.status === 'all' || item.status === filters.status;
  return matchesSearch && matchesFilter;
});
```

### Modal Pattern

```javascript
const [selectedItem, setSelectedItem] = useState(null);
const [showModal, setShowModal] = useState(false);

// Show modal
const openModal = (item) => {
  setSelectedItem(item);
  setShowModal(true);
};

// Close modal
const closeModal = () => {
  setShowModal(false);
  setSelectedItem(null);
};
```

---

## ⚠️ CRITICAL ISSUES & BLOCKERS

### 1. 🚨 Hard-Coded Demo Mode (Login.jsx)

**Severity**: CRITICAL
**File**: [Login.jsx](frontend-react/src/pages/Login.jsx) lines ~60-80
**Issue**: Three hardcoded test accounts bypass API authentication
**Impact**: Cannot test real user authentication workflows
**Workaround**:

- Email: admin@example.com / Password: password → Works
- Email: autre@example.com / Password: password → Works
- Email: demo@example.com / Password: password → Works
  **Fix**: Remove `demoUsers` object + always call API `/login` endpoint

### 2. ❌ Archives Not Integrated

**Severity**: HIGH
**File**: [Archives.jsx](frontend-react/src/pages/Archives.jsx)
**Issue**: Completely mock data, no API calls
**Impact**: Cannot view actual archived messages
**Data**: `generateArchiveData(32)` called on mount - 100% local
**Fix**: Add `GET /courriers/archives` endpoint to backend + frontend call

### 3. ❌ Users Not Integrated

**Severity**: HIGH
**File**: [Utilisateurs.jsx](frontend-react/src/pages/Utilisateurs.jsx)
**Issue**: Completely mock data, no API calls
**Impact**: User directory is fake, admin cannot manage users
**Data**: `generateMockUsers(25)` called on mount - 100% local
**Fix**: Add user management endpoints to backend + integrate API calls

### 4. ⚠️ Statistics Uses Mock Data

**Severity**: MEDIUM
**File**: [Statistiques.jsx](frontend-react/src/pages/Statistiques.jsx)
**Issue**: Always shows `getMockStats(period)` instead of real data
**Impact**: Analytics cannot reflect actual system usage
**Fix**: Call `/statistiques` endpoint + use backend response

### 5. ⚠️ Dashboard Stats Sometimes Show 0

**Severity**: MEDIUM
**File**: [Dashboard.jsx](frontend-react/src/pages/Dashboard.jsx)
**Issue**: Demo mode token causes stats endpoint to return empty
**Impact**: Dashboard is offline in demo mode
**Fix**: Ensure `/statistiques` returns data or use meaningful defaults

---

## 📋 SUMMARY TABLE

| Component      | Implementation | API Calls            | Status        |
| -------------- | -------------- | -------------------- | ------------- |
| Dashboard      | Complete UI    | `/statistiques`      | ⚠️ Partial    |
| Inbox          | Complete       | `/courriers/inbox`   | ✅ Full       |
| Sent           | Complete       | `/courriers` POST    | ✅ Full       |
| Archives       | Complete UI    | None                 | ❌ Broken     |
| Statistics     | Complete       | `/statistiques`      | ⚠️ Mock       |
| Users          | Complete UI    | None                 | ❌ Broken     |
| Messages       | Partial        | `/messages`          | ✅ Partial    |
| Notifications  | Partial        | `/api/notifications` | ⚠️ Incomplete |
| Settings       | Help only      | None                 | ✅ Info       |
| Profile        | Local storage  | None                 | ✅ Local      |
| Admin Requests | Complete       | `/register-requests` | ✅ Full       |
| Login          | Has demo mode  | `/login`             | ❌ Blocked    |

---

## 📁 ALL FILE PATHS REFERENCE

### Pages (src/pages/)

```
Dashboard.jsx                    ✅ Home dashboard
CourriersEntrants.jsx            ✅ Inbox
CourriersSortants.jsx            ✅ Sent
Archives.jsx                     ⚠️  Archive (mock)
Messagerie.jsx                   ✅ Messages
Statistiques.jsx                 ⚠️  Stats (mock)
Utilisateurs.jsx                 ❌ Users (mock)
Parametres.jsx                   ✅ Help
Profil.jsx                       ✅ Profile
Notifications.jsx                ⚠️  Notifications
AccountRequests.jsx              ✅ Admin panel
Login.jsx                        ❌ Demo mode
ForgotPassword.jsx               ? Legacy
ForgotPasswordCode.jsx           ? Legacy
ResetPassword.jsx                ? Legacy
Nouvelle.jsx                     ❌ Stub
```

### Components (src/components/)

```
Layout/
  └── Layout.jsx, Sidebar.jsx, Navbar.jsx
Auth/
  └── PrivateRoute.jsx
DocumentPreview/
  └── DocumentPreview component
ErrorAlert/
  └── Error display component
SuccessAlert/
  └── Success display component
NotificationCenter/
  └── Toast/notification system
IncomingMessageToast/
  └── Message alert component
```

### Services (src/services/)

```
api.js                           ✅ Axios + helpers
```

### Store (src/store/)

```
index.js                         ✅ Redux config
slices/
  ├── authSlice.js              ✅ Auth state
  └── couriersSlice.js          ✅ Messages state
```

---

## 🎯 NEXT STEPS (RECOMMENDATIONS)

1. **Fix Demo Mode** (Priority 1)
   - Remove hardcoded accounts from Login.jsx
   - Always call real `/login` API endpoint

2. **Integrate Archives** (Priority 2)
   - Create `GET /courriers/archives` backend endpoint
   - Call it in Archives.jsx instead of mock generator

3. **Integrate Users** (Priority 3)
   - Create user management API endpoints
   - Replace mock generator with real API calls

4. **Fix Statistics** (Priority 4)
   - Ensure Dashboard + Statistiques always call `/statistiques`
   - Remove `getMockStats()` or use as fallback only

5. **Complete Features** (Priority 5)
   - Implement message detail view (Messagerie)
   - Implement notifications properly (backend + frontend)
   - Add bulk actions (delete/archive multiple)
   - Add real-time updates (WebSocket)

---

**Report Generated**: 18 MAI 2026  
**Frontend Version**: React 19.2  
**Status**: Functional with caveats - demo mode blocks real testing
