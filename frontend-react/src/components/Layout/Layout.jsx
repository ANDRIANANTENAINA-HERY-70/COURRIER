import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiHome,
  FiInbox,
  FiSend,
  FiArchive,
  FiUsers,
  FiSettings,
  FiBarChart2,
  FiMenu,
  FiX,
  FiLogOut,
  FiBell,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiShield,
  FiFileText,
  FiUser
} from 'react-icons/fi'
import { ROLE_PERMISSIONS } from '../../utils/rolePermissions'
import { resolveAvatarSrc } from '../../utils/avatar'
import { normalizeRole } from '../../utils/roles'
import './Layout.css'

const defaultNotifications = [
  { id: 1, message: 'Nouveau courrier urgent', time: '5 min', read: false, roles: ['admin', 'directeur', 'secretaire'], link: '/courriers/entrants' },
  { id: 2, message: 'Courrier #COU-2024-001 traité', time: '1 heure', read: false, roles: ['admin', 'secretaire'], link: '/courriers/archives' },
  { id: 3, message: 'Rappel: Réunion à 14h', time: '2 heures', read: true, roles: ['admin', 'directeur'], link: '/', sticky: true },
  { id: 4, message: 'Nouveau document comptable', time: '30 min', read: false, roles: ['compta'], link: '/courriers/entrants' },
  { id: 5, message: 'Demande de congés', time: '1 jour', read: false, roles: ['rh'], link: '/courriers/entrants' }
]

const Layout = ({ darkMode, setDarkMode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const notificationsRef = useRef(null)
  const userMenuRef = useRef(null)
  const readStoredUser = () => {
    const userData = localStorage.getItem('user')
    if (!userData) return null

    try {
      return JSON.parse(userData)
    } catch {
      localStorage.removeItem('user')
      return null
    }
  }
  const [avatarSrc, setAvatarSrc] = useState(() => resolveAvatarSrc(readStoredUser()))
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [userName, setUserName] = useState(() => {
    const stored = localStorage.getItem('userProfileName')
    if (stored) return stored
    const storedUser = readStoredUser()
    return storedUser?.name || ''
  })
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('notifications')
    if (stored) return JSON.parse(stored)
    localStorage.setItem('notifications', JSON.stringify(defaultNotifications))
    return defaultNotifications
  })
  const location = useLocation()
  const navigate = useNavigate()

  // Récupérer l'utilisateur du localStorage
  useEffect(() => {
    const storedUser = readStoredUser()
    if (!storedUser) return

    setUser(storedUser)
    setUserName(storedUser.name || userName)
    setAvatarSrc(resolveAvatarSrc(storedUser))
    setAvatarFailed(false)
  }, [])

  // Menu items avec vérification des rôles
  const getMenuItems = () => {
    const allItems = [
      { path: '/', id: 'dashboard', icon: FiHome, label: 'Tableau de bord' },
      { path: '/courriers/entrants', id: 'courriers_entrants', icon: FiInbox, label: 'Courriers entrants' },
      { path: '/courriers/sortants', id: 'courriers_sortants', icon: FiSend, label: 'Courriers sortants' },
      { path: '/courriers/archives', id: 'archives', icon: FiArchive, label: 'Archives' },
      { path: '/statistiques', id: 'statistiques', icon: FiBarChart2, label: 'Statistiques' },
      { path: '/utilisateurs', id: 'utilisateurs', icon: FiUsers, label: 'Utilisateurs' },
      { path: '/parametres', id: 'parametres', icon: FiSettings, label: 'Paramètres' }
    ]

    if (!user || !user.role) return [allItems[0]] // Retourner au moins le dashboard

    const userPermissions = ROLE_PERMISSIONS[normalizeRole(user.role)] || []
    return allItems.filter(item => userPermissions.includes(item.id))
  }

  const menuItems = getMenuItems()

  // Filtrer les notifications selon le rôle
  const getFilteredNotifications = () => {
    if (!user) return notifications.filter(n => n.roles.includes('admin'))
    return notifications.filter(n => n.roles.includes(user.role))
  }

  const userNotifications = getFilteredNotifications()
  const unreadCount = userNotifications.filter(n => !n.read).length

  const toggleNotifications = () => {
    const next = !notificationsOpen
    setNotificationsOpen(next)
    if (next) {
      // Marquer comme lues lorsqu'on ouvre le panneau
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const handleNotificationClick = (notif) => {
    setNotificationsOpen(false)
    setNotifications(prev => prev.reduce((acc, curr) => {
      if (curr.id !== notif.id) {
        acc.push(curr)
        return acc
      }
      // si notification persistante, on la garde mais on la marque lue
      if (curr.sticky) {
        acc.push({ ...curr, read: true })
      }
      // sinon on la supprime en ne la ré-ajoutant pas
      return acc
    }, []))
  }

  // Fermer le panneau de notifications en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsOpen && notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notificationsOpen, userMenuOpen])

  // Sync avatar updates coming from profile page (localStorage + custom event)
  useEffect(() => {
    const syncAvatar = () => {
      const storedUser = readStoredUser()
      setAvatarSrc(resolveAvatarSrc(storedUser))
      setAvatarFailed(false)
      if (storedUser) setUser(storedUser)
    }
    const syncName = () => {
      const stored = localStorage.getItem('userProfileName')
      if (stored) setUserName(stored)
      const storedUser = readStoredUser()
      if (storedUser) {
        setUser(storedUser)
        setUserName(storedUser.name || stored || userName)
        setAvatarSrc(resolveAvatarSrc(storedUser))
        setAvatarFailed(false)
      }
    }
    const syncNotifications = () => {
      const stored = localStorage.getItem('notifications')
      if (stored) setNotifications(JSON.parse(stored))
    }
    window.addEventListener('storage', syncAvatar)
    window.addEventListener('avatar-updated', syncAvatar)
    window.addEventListener('user-name-updated', syncName)
    window.addEventListener('notifications-updated', syncNotifications)
    return () => {
      window.removeEventListener('storage', syncAvatar)
      window.removeEventListener('avatar-updated', syncAvatar)
      window.removeEventListener('user-name-updated', syncName)
      window.removeEventListener('notifications-updated', syncNotifications)
    }
  }, [])

  // Persister les notifications côté client
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setDarkMode(false)
    window.dispatchEvent(new Event('auth-changed'))
    navigate('/login')
  }

  // Obtenir le libellé du rôle en français
  const getRoleLabel = (role) => {
    const roles = {
      'admin': 'Administrateur',
      'directeur': 'Directeur',
      'secretaire': 'Secrétaire',
      'agent': 'Agent',
      'compta': 'Comptabilité',
      'rh': 'Ressources Humaines'
    }
    return roles[normalizeRole(role)] || role
  }

  // Obtenir l'initiale pour l'avatar
  const getUserInitial = () => {
    if (avatarSrc && !avatarFailed) return ''
    if (!userName) return 'A'
    return userName.charAt(0).toUpperCase()
  }

  return (
    <div className="layout">
      {/* Navbar principale */}
      <nav className="main-navbar">
        <div className="navbar-left">
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu mobile"
          >
            <FiMenu />
          </button>

          <div className="logo">
            <FiFileText className="logo-icon" />
            <span>Gestion Courrier</span>
          </div>
        </div>

        {/* Menu desktop */}
        <div className="desktop-menu">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`desktop-menu-item ${isActive ? 'active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="navbar-right">
          {/* Mode sombre */}
          <button
            className="nav-icon-btn"
            onClick={() => setDarkMode(!darkMode)}
            aria-label="Mode sombre/clair"
          >
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>

          {/* Notifications */}
          {userNotifications.length > 0 && (
            <div className="notification-wrapper" ref={notificationsRef}>
              <button
                className="nav-icon-btn"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className="badge">{unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    className="notifications-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <h4>Notifications</h4>
                    {userNotifications.map(notif => (
                      <Link
                        key={notif.id}
                        to={notif.link || '#'}
                        className={`notification-item notification-link ${!notif.read ? 'unread' : ''}`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <p>{notif.message}</p>
                        <span className="time">{notif.time}</span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Menu utilisateur */}
          <div className="user-menu-wrapper" ref={userMenuRef}>
            <div
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                {avatarSrc && !avatarFailed ? (
                  <img src={avatarSrc} alt="Avatar utilisateur" onError={() => setAvatarFailed(true)} onLoad={() => setAvatarFailed(false)} />
                ) : (
                  getUserInitial()
                )}
              </div>
              <FiChevronDown />
            </div>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  className="user-dropdown"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="user-info-header">
                    <FiUser />
                    <div>
                      <div className="user-name">{userName || 'Utilisateur'}</div>
                      <div className="user-role-badge">
                        <FiShield />
                        {getRoleLabel(user?.role)}
                      </div>
                    </div>
                  </div>
                  <hr />
                  <Link
                    to="/profil"
                    state={{ backgroundLocation: location }}
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Mon profil
                  </Link>
                  <Link to="/parametres">Paramètres</Link>
                  <hr />
                  <button onClick={handleLogout}>
                    <FiLogOut /> Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className={`mobile-sidebar open`}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="mobile-sidebar-header">
                <div className="logo">
                  <FiFileText className="logo-icon" />
                  <span>Gestion Courrier</span>
                </div>
                <button
                  className="close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fermer"
                >
                  <FiX />
                </button>
              </div>

              <nav className="mobile-sidebar-nav">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="mobile-sidebar-footer">
                <div className="user-info">
                  <div className="user-avatar">
                    {avatarSrc && !avatarFailed ? (
                      <img src={avatarSrc} alt="Avatar utilisateur" onError={() => setAvatarFailed(true)} onLoad={() => setAvatarFailed(false)} />
                    ) : (
                      getUserInitial()
                    )}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{userName || user?.name || 'Admin'}</span>
                    <span className="user-role">{getRoleLabel(user?.role)}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Overlay pour mobile */}
            <motion.div
              className="overlay"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Page Content - SANS l'en-tête dupliqué */}
      <main className="main-content">
        {/* L'en-tête a été SUPPRIMÉ d'ici */}
        <div className="page-content">
          <Outlet context={{ darkMode, setDarkMode }} />
        </div>
      </main>
    </div>
  )
}

export default Layout
