import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ForgotPasswordCode from './pages/ForgotPasswordCode'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import CourriersEntrants from './pages/CourriersEntrants'
import CourriersSortants from './pages/CourriersSortants'
import Archives from './pages/Archives'
import Statistiques from './pages/Statistiques'
import Utilisateurs from './pages/Utilisateurs'
import Profil from './pages/Profil'
import Parametres from './pages/Parametres'
import { fetchUserSettings } from './services/api'
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/Auth/PrivateRoute'
import PermissionRoute from './components/Auth/PermissionRoute'
import './styles/global.css'

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

function AppContent() {
  const location = useLocation()
  const backgroundLocation = location.state?.backgroundLocation
  const [darkMode, setDarkMode] = useState(false)

  const loadThemeFromServer = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const { data } = await fetchUserSettings()
      const theme = data.settings?.theme === 'dark'
      setDarkMode(theme)
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  useEffect(() => {
    loadThemeFromServer()

    const syncDarkMode = () => {
      loadThemeFromServer()
    }

    window.addEventListener('auth-changed', syncDarkMode)
    window.addEventListener('settings-updated', syncDarkMode)

    return () => {
      window.removeEventListener('auth-changed', syncDarkMode)
      window.removeEventListener('settings-updated', syncDarkMode)
    }
  }, [loadThemeFromServer])

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: darkMode ? '#333' : '#fff',
              color: darkMode ? '#fff' : '#333',
              borderRadius: '10px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
          }}
        />

        <AnimatePresence mode="wait">
          <Routes location={backgroundLocation || location}>
            <Route path="/login" element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Login setDarkMode={setDarkMode} darkMode={darkMode} />
              </motion.div>
            } />

            <Route path="/forgot-password" element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ForgotPassword />
              </motion.div>
            } />

            <Route path="/forgot-password-code" element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ForgotPasswordCode />
              </motion.div>
            } />

            <Route path="/reset-password" element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResetPassword />
              </motion.div>
            } />

            <Route path="/" element={
              <PrivateRoute>
                <Layout darkMode={darkMode} setDarkMode={setDarkMode} />
              </PrivateRoute>
            }>
              <Route index element={
                <PermissionRoute pageId="dashboard">
                  <Dashboard />
                </PermissionRoute>
              } />
              <Route path="dashboard" element={
                <PermissionRoute pageId="dashboard">
                  <Dashboard />
                </PermissionRoute>
              } />
              <Route path="admin/dashboard" element={
                <PermissionRoute pageId="admin_dashboard">
                  <AdminDashboard />
                </PermissionRoute>
              } />
              <Route path="courriers/entrants" element={
                <PermissionRoute pageId="courriers_entrants">
                  <CourriersEntrants />
                </PermissionRoute>
              } />
              <Route path="courriers/sortants" element={
                <PermissionRoute pageId="courriers_sortants">
                  <CourriersSortants />
                </PermissionRoute>
              } />
              <Route path="courriers/archives" element={
                <PermissionRoute pageId="archives">
                  <Archives />
                </PermissionRoute>
              } />
              <Route path="statistiques" element={
                <PermissionRoute pageId="statistiques">
                  <Statistiques />
                </PermissionRoute>
              } />
              <Route path="utilisateurs" element={
                <PermissionRoute pageId="utilisateurs">
                  <Utilisateurs />
                </PermissionRoute>
              } />
              <Route path="profil" element={
                <Profil />
              } />
              <Route path="parametres" element={
                <PermissionRoute pageId="parametres">
                  <Parametres />
                </PermissionRoute>
              } />
            </Route>
          </Routes>

          {backgroundLocation && location.pathname === '/profil' && (
            <Routes>
              <Route
                path="/profil"
                element={
                  <motion.div
                    className="route-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Profil />
                  </motion.div>
                }
              />
            </Routes>
          )}
        </AnimatePresence>
      </div>
  )
}

export default App
