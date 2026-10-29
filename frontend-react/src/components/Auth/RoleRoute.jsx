import React from 'react'
import { Navigate } from 'react-router-dom'
import { normalizeRole } from '../../utils/roles'

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const RoleRoute = ({ children, allowedRoles = [], fallback = '/' }) => {
  const user = getStoredUser()
  const userRole = normalizeRole(user?.role)

  const isAllowed =
    allowedRoles.length === 0 ||
    allowedRoles.includes(userRole) ||
    allowedRoles.includes(user?.role)

  if (!isAllowed) {
    return <Navigate to={fallback} replace />
  }

  return children
}

export default RoleRoute
