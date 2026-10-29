import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiBell, FiUser } from 'react-icons/fi';
import { fetchCourrierInbox, fetchCurrentUser } from '../../services/api';
import { resolveAvatarSrc } from '../../utils/avatar';
import './Navbar.css';

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

const Navbar = ({ toggleDarkMode, darkMode }) => {
  const { user } = useSelector((state) => state.auth);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(() => resolveAvatarSrc(user || readStoredUser()))
  const [avatarFailed, setAvatarFailed] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAvatarUpdate = () => {
      loadUserAvatar();
    };
    window.addEventListener('avatar-updated', handleAvatarUpdate);
    window.addEventListener('user-name-updated', handleAvatarUpdate);
    window.addEventListener('profile-updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatar-updated', handleAvatarUpdate);
      window.removeEventListener('user-name-updated', handleAvatarUpdate);
      window.removeEventListener('profile-updated', handleAvatarUpdate);
    };
  }, []);

  const loadUserAvatar = async () => {
    try {
      const { data } = await fetchCurrentUser();
      if (import.meta.env.DEV) {
        console.debug('[navbar] api user payload', {
          userId: data.user?.id,
          email: data.user?.email,
          photo_url: data.user?.photo_url,
          photo: data.user?.photo,
        })
      }
      const resolved = resolveAvatarSrc(data.user);
      if (resolved) {
        setAvatarUrl(resolved);
        setAvatarFailed(false)
        return;
      }

      const storedUser = readStoredUser()
      const fallback = storedUser && (
        storedUser.id === data.user?.id ||
        (storedUser.email && data.user?.email && storedUser.email === data.user.email)
      )
        ? resolveAvatarSrc(storedUser)
        : ''
      if (fallback) {
        setAvatarUrl(fallback)
        setAvatarFailed(false)
      }
    } catch (err) {
      const storedUser = readStoredUser()
      if (import.meta.env.DEV) {
        console.debug('[navbar] fallback stored user payload', {
          userId: storedUser?.id,
          email: storedUser?.email,
          photo_url: storedUser?.photo_url,
          photo: storedUser?.photo,
        })
      }
      const fallback = storedUser && (
        storedUser.id === user?.id ||
        (storedUser.email && user?.email && storedUser.email === user.email)
      )
        ? resolveAvatarSrc(storedUser)
        : ''
      if (fallback) {
        setAvatarUrl(fallback)
        setAvatarFailed(false)
      }
    }
  };

  // Load avatar on component mount
  useEffect(() => {
    loadUserAvatar();
  }, [user?.id]);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const res = await fetchCourrierInbox();
        const unread = (res.data.data || []).filter(courrier => !courrier.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        // Silencieusement ignorer l'erreur
      }
    };

    // Load initial count
    loadUnreadCount();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadUnreadCount, 5000);
    
    // Listen for auth changes to refresh
    const handleAuthChange = () => loadUnreadCount();
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2>Bienvenue, {user?.name || 'Utilisateur'}</h2>
      </div>

      <div className="navbar-right">
        <motion.button
          className="nav-icon-btn"
          onClick={toggleDarkMode}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {darkMode ? <FiSun /> : <FiMoon />}
        </motion.button>

        <motion.button
          className="nav-icon-btn"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/courriers/entrants')}
        >
          <FiBell />
          {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </motion.button>

        <motion.div 
          className="user-profile"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate('/profil', { state: { backgroundLocation: location } })}
          style={{ cursor: 'pointer' }}
        >
          {avatarUrl && !avatarFailed ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="user-avatar-img"
              onLoad={() => setAvatarFailed(false)}
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <>
              <FiUser />
              <span>{user?.name?.charAt(0) || 'U'}</span>
            </>
          )}
        </motion.div>
      </div>
    </nav>
  );
};

export default Navbar;
