import { normalizeRole } from './roles'

export const ROLE_PERMISSIONS = {
  admin: [
    'dashboard',
    'admin_dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'archives',
    'statistiques',
    'utilisateurs',
    'parametres',
    'profil'
  ],
  dg: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'archives',
    'parametres',
    'profil'
  ],
  sg: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'archives',
    'statistiques',
    'parametres',
    'profil'
  ],
  service_courrier: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'archives',
    'parametres',
    'profil'
  ],
  rh: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'statistiques',
    'parametres',
    'profil'
  ],
  drh: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'statistiques',
    'utilisateurs',
    'parametres',
    'profil'
  ],
  compta: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'statistiques',
    'parametres',
    'profil'
  ],
  technique: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'statistiques',
    'parametres',
    'profil'
  ],
  circuit: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'archives',
    'parametres',
    'profil'
  ],
  autre: [
    'dashboard',
    'courriers_entrants',
    'courriers_sortants',
    'parametres',
    'profil'
  ]
}

/**
 * Vérifie si un utilisateur a accès à une page
 * @param {string} userRole - Le rôle de l'utilisateur
 * @param {string} pageId - L'identifiant de la page
 * @returns {boolean}
 */
export const hasPermission = (userRole, pageId) => {
  const normalizedRole = normalizeRole(userRole)

  if (!normalizedRole || !ROLE_PERMISSIONS[normalizedRole]) {
    return false
  }
  return ROLE_PERMISSIONS[normalizedRole].includes(pageId)
}

/**
 * Obtient la liste des pages accessibles pour un rôle
 * @param {string} userRole - Le rôle de l'utilisateur
 * @returns {Array}
 */
export const getAccessiblePages = (userRole) => {
  return ROLE_PERMISSIONS[normalizeRole(userRole)] || []
}
