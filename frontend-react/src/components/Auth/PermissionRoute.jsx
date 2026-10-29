import React from 'react'
import { Navigate } from 'react-router-dom'
import { hasPermission } from '../../utils/rolePermissions'

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch (error) {
    localStorage.removeItem('user')
    return null
  }
}

/**
 * Composant pour protéger les routes basé sur les permissions du rôle
 * @param {React.ReactNode} children - Le contenu à afficher si l'utilisateur a accès
 * @param {string} pageId - L'identifiant de la page (doit correspondre à ROLE_PERMISSIONS)
 * @param {string} fallback - La route de redirection en cas d'accès refusé (défaut: /dashboard)
 */
const PermissionRoute = ({ children, pageId, fallback = '/dashboard' }) => {
  const user = getStoredUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userRole = user.role || user.user?.role
  if (!userRole) {
    return <Navigate to={fallback} replace />
  }

  const hasAccess = hasPermission(userRole, pageId)

  if (!hasAccess) {
    // Rediriger vers le dashboard si pas de fallback spécifique
    return <Navigate to={fallback} replace />
  }

  return children
}

export default PermissionRoute