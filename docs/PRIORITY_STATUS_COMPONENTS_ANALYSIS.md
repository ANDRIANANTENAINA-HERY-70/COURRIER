# React Frontend: Priority & Status Components Analysis

## Overview

This document provides a comprehensive analysis of how "priorité" (priority) and "statut" (status) fields are displayed and managed in the React frontend.

---

## 1. MAIN COMPONENTS

### 1.1 CourriersSortants (Outgoing Mail)

**File:** `frontend-react/src/pages/CourriersSortants.jsx`

#### Status Handling

- **Status Values:** `envoye`, `en_preparation`, `en_cours`, `livre`, `archive`
- **Function:** `getStatusIcon(statut)` - Maps status to icon
  - `envoye` → FiSend icon
  - `en_preparation` → FiClock icon
  - `en_cours` → FiAlertCircle icon
  - `livre` → FiCheckCircle icon
  - `archive` → FiArchive icon

- **Function:** `getStatusText(statut)` - Maps status to French text
  - `envoye` → "Envoyé"
  - `en_preparation` → "En préparation"
  - `en_cours` → "En cours"
  - `livre` → "Livré"
  - `archive` → "Archivé"

- **Function:** `getStatusClass(statut)` - Returns CSS class for styling
  - `envoye` → "info"
  - `en_preparation` → "warning"
  - `en_cours` → "danger"
  - `livre` → "success"
  - `archive` → "info"

#### Priority Handling

- **Priority Values:** `basse`, `normale`, `urgente`
- **Function:** `getPriorityClass(priorite)` - Returns CSS class
  - `basse` → "success"
  - `normale` → "info"
  - `urgente` → "danger"

#### Table Rendering (Lines 900-1000)

```jsx
<th>Priorité</th>
<th>Statut</th>

<!-- In table rows: -->
<td className="badge-cell" data-label="Priorité">
  <span className={`badge badge-${getPriorityClass(courrier.priorite)}`}>
    {courrier.priorite}
  </span>
</td>
<td className="badge-cell" data-label="Statut">
  <span className={`badge badge-${getStatusClass(courrier.statut)}`}>
    {getStatusIcon(courrier.statut)}{" "}
    {getStatusText(courrier.statut)}
  </span>
</td>
```

#### Modal Display (Lines 1180-1195)

Displays status and priority in detail modal with:

- Status badge with icon
- Status text translation
- Priority display

---

### 1.2 CourriersEntrants (Incoming Mail)

**File:** `frontend-react/src/pages/CourriersEntrants.jsx`

#### Status Handling

- **Status Values:** `en_attente`, `urgent`, `traite`, `archive`
- **Function:** `getStatusIcon(statut)` - Maps status to icon
  - `en_attente` → FiClock icon
  - `urgent` → FiAlertCircle icon
  - `traite` → FiCheckCircle icon
  - `archive` → FiArchive icon
  - default → FiMail icon

- **Function:** `getStatusText(statut)` - Maps status to French text
  - `en_attente` → "En attente"
  - `traite` → "Traité"
  - `archive` → "Archivé"
  - `urgent` → "Urgent"

- **Function:** `getStatusClass(statut)` - Returns CSS class
  - `en_attente` → "warning"
  - `traite` → "success"
  - `archive` → "info"
  - `urgent` → "danger"

#### Priority Handling

- **Priority Values:** `basse`, `normale`, `urgente`
- Uses same `getPriorityClass()` function as CourriersSortants

#### Table Rendering (Lines 844-867)

```jsx
<th>Priorité</th>
<th>Statut</th>

<!-- In table rows: -->
<td className="badge-cell" data-label="Priorité">
  <span className={`badge badge-${getPriorityClass(courrier.priorite)}`}>
    {courrier.priorite}
  </span>
</td>
<td className="badge-cell" data-label="Statut">
  <span className={`badge badge-${getStatusClass(courrier.statut)}`}>
    {getStatusText(courrier.statut)}
  </span>
</td>
```

#### Edit Form (Lines 57-70)

```jsx
const [editForm, setEditForm] = useState({
  statut: "",
  priorite: "",
  notes: "",
});
```

---

### 1.3 Utilisateurs (Users Management)

**File:** `frontend-react/src/pages/Utilisateurs.jsx`

#### User Status Handling

- **Status Values:** `actif`, `inactif`, `reset-warning` (for password reset)
- **Function:** `handleToggleStatus(user)` - Toggle user active status
- User status is separate from courrier status

#### Status Display (Lines 408-420)

```jsx
<div className="user-status">
  {user.isActive ? (
    <span className="status-badge actif">
      <FiCheckCircle /> actif
    </span>
  ) : (
    <span className="status-badge inactif">
      <FiXCircle /> inactif
    </span>
  )}
  {user.passwordResetPending && (
    <span className="status-badge reset-warning">
      <FiAlertTriangle /> reset demandé
    </span>
  )}
</div>
```

**Note:** Users page uses status for account status, NOT priority. Priority field does not appear on this page.

---

### 1.4 Statistiques (Statistics)

**File:** `frontend-react/src/pages/Statistiques.jsx`

#### Priority Breakdown Display (Lines 360-393)

Shows priority distribution with:

- **Priority items:**
  - Urgents (urgent)
  - Normal (normale)
  - Faible (basse)

- **Display structure:**
  ```jsx
  <div className="priority-item">
    <span className="priority-label">Urgents</span>
    <div className="progress-bar">
      <div className="progress danger" style={{ width: `${percent}%` }} />
    </div>
    <span className="priority-value">{count}</span>
  </div>
  ```

#### Styling in Statistiques.css (Lines 303-345)

```css
.priority-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.priority-label {
  width: 80px;
  color: var(--secondary);
}

.priority-value {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: var(--dark);
}
```

---

## 2. STYLING & CSS CLASSES

### 2.1 Badge Styles (Courriers.css)

**File:** `frontend-react/src/pages/Courriers.css`

#### Base Badge Styling (Lines 408-440)

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
}
```

#### Color Variants

- **`.badge-success`** - Light green background, success color

  ```css
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
  ```

- **`.badge-warning`** - Light orange background, warning color

  ```css
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
  border: 1px solid rgba(245, 158, 11, 0.2);
  ```

- **`.badge-danger`** - Light red background, danger color

  ```css
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
  ```

- **`.badge-info`** - Light blue background, info color
  ```css
  background: rgba(59, 130, 246, 0.1);
  color: var(--info);
  border: 1px solid rgba(59, 130, 246, 0.2);
  ```

### 2.2 Badge Cell Styling (Courriers.css, Lines 416-424)

```css
.badge-cell {
  text-align: center;
  vertical-align: middle;
}

.badge-cell .badge {
  justify-content: center;
  min-width: 84px;
  margin: 0 auto;
}
```

**KEY PROPERTY:** `vertical-align: middle` on `.badge-cell` for alignment

### 2.3 User Status Badges (Utilisateurs.css)

**File:** `frontend-react/src/pages/Utilisateurs.css`

#### General Status Badge (Lines 211-220)

```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}
```

#### Status Variants

- **`.status-badge.actif`** - Green (active)

  ```css
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
  ```

- **`.status-badge.inactif`** - Red (inactive)

  ```css
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
  ```

- **`.status-badge.reset-warning`** - Red warning
  ```css
  background: rgba(239, 68, 68, 0.16);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.35);
  ```

---

## 3. RESPONSIVE DESIGN ISSUES

### 3.1 Mobile Table Transformation (Courriers.css, Lines 1169-1350)

**Breakpoint:** `max-width: 768px`

#### Changes:

1. Table headers hidden: `display: none`
2. Table rows become card blocks
3. Data labels displayed via `attr(data-label)` pseudo-element
4. Each `<td>` shows label on left side via `::before` pseudo-element

#### Mobile TD Display (Lines 1295-1305)

```css
.courriers-table td::before {
  content: attr(data-label);
  font-weight: 600;
  width: 100px;
  min-width: 100px;
  color: var(--secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

#### Badge Cell Mobile (Lines 1310-1312)

```css
.badge-cell {
  align-items: center;
}
```

**⚠️ IMPORTANT:** The mobile CSS overrides `.badge-cell` alignment but does NOT have `flex` display set.

### 3.2 Status Badge Display in Responsive Tables

**Problem Area:** Mobile badge cells may have alignment issues because:

1. `.badge-cell` in mobile media query sets `align-items: center` but doesn't explicitly set `display: flex`
2. `.badge` uses `display: inline-flex` which may not center properly in mobile card layout
3. Data label is added via `::before` pseudo-element, potentially pushing badge content

---

## 4. MAPPING TABLE: PRIORITY & STATUS VALUES

### Priority Mapping

| File | Value     | CSS Class     | Color |
| ---- | --------- | ------------- | ----- |
| Both | `basse`   | badge-success | Green |
| Both | `normale` | badge-info    | Blue  |
| Both | `urgente` | badge-danger  | Red   |

### Status Mapping (CourriersSortants)

| Value            | CSS Class     | Text           | Icon          |
| ---------------- | ------------- | -------------- | ------------- |
| `envoye`         | badge-info    | Envoyé         | FiSend        |
| `en_preparation` | badge-warning | En préparation | FiClock       |
| `en_cours`       | badge-danger  | En cours       | FiAlertCircle |
| `livre`          | badge-success | Livré          | FiCheckCircle |
| `archive`        | badge-info    | Archivé        | FiArchive     |

### Status Mapping (CourriersEntrants)

| Value        | CSS Class     | Text       | Icon          |
| ------------ | ------------- | ---------- | ------------- |
| `en_attente` | badge-warning | En attente | FiClock       |
| `urgent`     | badge-danger  | Urgent     | FiAlertCircle |
| `traite`     | badge-success | Traité     | FiCheckCircle |
| `archive`    | badge-info    | Archivé    | FiArchive     |

---

## 5. KEY HTML/JSX PATTERNS

### Pattern 1: Badge with Icon and Text (CourriersSortants)

```jsx
<span className={`badge badge-${getStatusClass(courrier.statut)}`}>
  {getStatusIcon(courrier.statut)} {getStatusText(courrier.statut)}
</span>
```

### Pattern 2: Badge Text Only (CourriersEntrants)

```jsx
<span className={`badge badge-${getStatusClass(courrier.statut)}`}>
  {getStatusText(courrier.statut)}
</span>
```

### Pattern 3: Priority Badge

```jsx
<span className={`badge badge-${getPriorityClass(courrier.priorite)}`}>
  {courrier.priorite}
</span>
```

### Pattern 4: Mobile Data Label

```jsx
<td className="badge-cell" data-label="Priorité">
  <!-- content -->
</td>
```

---

## 6. CSS CUSTOM PROPERTIES USED

- `--primary`, `--primary-dark` - Main blue color
- `--secondary` - Gray text color
- `--success` - Green (#10b981)
- `--warning` - Orange (#f59e0b)
- `--danger` - Red (#ef4444)
- `--info` - Light Blue (#3b82f6)
- `--white`, `--dark`
- `--gray-100`, `--gray-200`, `--gray-300`, `--gray-700`, `--gray-800`
- `--shadow-md`, `--shadow-xl`

---

## 7. POTENTIAL ALIGNMENT ISSUES FOUND

### Issue 1: Mobile Badge Cell Alignment

**Location:** `Courriers.css` Lines 1310-1312

- Mobile `.badge-cell` sets `align-items: center` without explicit `display: flex`
- Parent table cells are block-level on mobile, may cause alignment problems

### Issue 2: Inline-flex vs Block Context

- `.badge` uses `display: inline-flex`
- On mobile, table cells are `display: block`
- This could cause wrapping or misalignment with data labels

### Issue 3: Data Label Width Fixed

**Location:** `Courriers.css` Line 1302

```css
width: 100px;
min-width: 100px;
```

- Fixed 100px label width might not accommodate translations like "Priorité" or "Statut" properly on narrow screens

### Issue 4: Badge Min-Width

**Location:** `Courriers.css` Line 422

```css
min-width: 84px;
```

- Fixed 84px minimum width might not work well with `inline-flex` when in mobile card layout

---

## 8. FILES INVOLVED

### Components/Pages (JSX)

- ✅ `frontend-react/src/pages/CourriersSortants.jsx` - Outgoing mail with priority & status
- ✅ `frontend-react/src/pages/CourriersEntrants.jsx` - Incoming mail with priority & status
- ✅ `frontend-react/src/pages/Utilisateurs.jsx` - User status only (no priority)
- ✅ `frontend-react/src/pages/Statistiques.jsx` - Priority statistics

### Styles (CSS)

- ✅ `frontend-react/src/pages/Courriers.css` - Main badge and table styles (520+ lines)
- ✅ `frontend-react/src/pages/Utilisateurs.css` - User status badge styles
- ✅ `frontend-react/src/pages/Statistiques.css` - Priority display styles
- ✅ `frontend-react/src/App.css` - Global styles
- ✅ `frontend-react/src/index.css` - Root CSS variables
- ✅ `frontend-react/src/styles/global.css` - Global theme variables

### No Dedicated Badge Components

- Priority/Status display is inline in pages, not in separate components
- No reusable Badge, Priority, or Status component found in `frontend-react/src/components/`

---

## 9. SUMMARY

### What's Rendered:

1. **Badges** - Colored pills with icons/text for status and priority
2. **Icons** - React Icons (FiSend, FiClock, FiAlertCircle, FiCheckCircle, FiArchive)
3. **Text** - French translations of status and priority values
4. **Mobile Cards** - Table transforms to card layout with data labels

### How They're Styled:

1. Base `.badge` class with flexbox
2. Color variants (success, warning, danger, info)
3. Custom property colors from `:root`
4. Mobile media query transformations

### Alignment Strategy:

1. Desktop: `text-align: center` on `.badge-cell`
2. Mobile: `align-items: center` on `.badge-cell` (with potential issues)
3. Badges use `justify-content: center` internally

### Potential Issues to Fix:

1. Mobile badge-cell alignment not explicit
2. Data label width might be too small or too large
3. Badge min-width may conflict with mobile layout
4. No explicit `display: flex` on mobile `.badge-cell`

---

## 10. RECOMMENDATIONS FOR INVESTIGATION

If you're experiencing alignment issues:

1. **Check mobile view (< 768px)** - Badge cells may have flex display issues
2. **Look for overflow** - Data labels might overflow or cause badge wrapping
3. **Test with actual French text** - Padding/width calculations might be off
4. **Verify vertical-align** - Desktop tables use `vertical-align: middle`
5. **Check badge min-width constraints** - 84px might be forcing issues on mobile
