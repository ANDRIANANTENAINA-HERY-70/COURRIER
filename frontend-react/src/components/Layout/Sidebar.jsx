import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiInbox, 
  FiSend, 
  FiArchive, 
  FiUsers, 
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiBell,
  FiFileText,
  FiBarChart2
} from 'react-icons/fi';
import { ROLE_PERMISSIONS } from '../../utils/rolePermissions';
import { normalizeRole } from '../../utils/roles';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Récupérer le rôle de l'utilisateur
  const user = useMemo(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const allMenuItems = [
    { path: '/', id: 'dashboard', icon: FiHome, label: 'Tableau de bord' },
    { path: '/courriers/entrants', id: 'courriers_entrants', icon: FiInbox, label: 'Courriers entrants' },
    { path: '/courriers/sortants', id: 'courriers_sortants', icon: FiSend, label: 'Courriers sortants' },
    { path: '/courriers/archives', id: 'archives', icon: FiArchive, label: 'Archives' },
    { path: '/statistiques', id: 'statistiques', icon: FiBarChart2, label: 'Statistiques' },
    { path: '/utilisateurs', id: 'utilisateurs', icon: FiUsers, label: 'Utilisateurs' },
    { path: '/parametres', id: 'parametres', icon: FiSettings, label: 'Paramètres' }
  ];

  // Filtrer les items du menu basé sur le rôle de l'utilisateur
  const menuItems = useMemo(() => {
    if (!user || !user.role) return [allMenuItems[0]]; // Afficher au moins le dashboard

    const userRole = normalizeRole(user.role);
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    return allMenuItems.filter(item => userPermissions.includes(item.id));
  }, [user]);

  return (
    <motion.aside
      className={`sidebar ${isOpen ? 'open' : 'closed'}`}
      animate={{ width: isOpen ? 280 : 80 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sidebar-header">
        <div className="logo">
          <FiFileText className="logo-icon" />
          {isOpen && <span>Gestion Courrier</span>}
        </div>
        
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <div key={item.path} className="nav-item-wrapper">
              <Link
                to={item.path}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Icon className="nav-icon" />
                {isOpen && <span className="nav-label">{item.label}</span>}

                {!isOpen && hoveredItem === item.path && (
                  <div className="tooltip">
                    {item.label}
                  </div>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="notification-badge">
          <FiBell />
          <span className="badge">3</span>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
