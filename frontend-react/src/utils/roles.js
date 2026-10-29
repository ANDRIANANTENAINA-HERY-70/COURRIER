export const ROLE_OPTIONS = [
  { value: 'admin', label: '👑 Administrateur' },
  { value: 'dg', label: '🏢 Direction Générale (DG)' },
  { value: 'sg', label: '📑 Secrétariat Général (SG)' },
  { value: 'service_courrier', label: '📬 Service Courrier' },
  { value: 'rh', label: '👨‍💼 Ressources Humaines (RH)' },
  { value: 'drh', label: '🧑‍💼 Direction Ressources Humaines (DRH)' },
  { value: 'compta', label: '💰 Comptabilité / Finance' },
  { value: 'technique', label: '📊 Service Technique' },
  { value: 'circuit', label: '🔄 Circuit Courrier' },
  { value: 'autre', label: '❓ Autre' },
]

export const SIGNUP_ROLE_OPTIONS = ROLE_OPTIONS.filter((role) => role.value !== 'admin')

export const ROLE_ALIASES = {
  directeur: 'dg',
  secretaire: 'sg',
  agent: 'service_courrier',
  agent_rh: 'rh',
}

export const normalizeRole = (role) => ROLE_ALIASES[role] || role || 'autre'

export const ROLE_LABELS = {
  admin: '👑 ADMINISTRATEUR',
  dg: '🏢 DIRECTION GÉNÉRALE (DG)',
  sg: '📑 SECRÉTARIAT GÉNÉRAL (SG)',
  service_courrier: '📬 SERVICE COURRIER',
  rh: '👨‍💼 RESSOURCES HUMAINES (RH)',
  drh: '🧑‍💼 DIRECTION RESSOURCES HUMAINES (DRH)',
  compta: '💰 COMPTABILITÉ / FINANCE',
  technique: '📊 SERVICE TECHNIQUE',
  circuit: '🔄 CIRCUIT COURRIER',
  autre: '❓ AUTRE',
}

export const ROLE_CLASSES = {
  admin: 'role-admin',
  dg: 'role-dg',
  sg: 'role-sg',
  service_courrier: 'role-service-courrier',
  rh: 'role-rh',
  drh: 'role-drh',
  compta: 'role-compta',
  technique: 'role-technique',
  circuit: 'role-circuit',
  autre: 'role-autre',
}

export const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || String(role || '').toUpperCase()

export const getRoleClass = (role) => ROLE_CLASSES[normalizeRole(role)] || ''
