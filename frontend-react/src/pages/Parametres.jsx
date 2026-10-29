import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import {
  FiBell,
  FiDownload,
  FiLock,
  FiMoon,
  FiRefreshCw,
  FiSave,
  FiSettings,
  FiSun,
  FiToggleLeft,
  FiToggleRight,
  FiUserCheck
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { fetchUserSettings, updateUserSettings } from '../services/api'
import './Parametres.css'

const getDefaults = () => ({
  notifications: true,
  emailNotifications: false,
  language: 'fr',
  theme: 'light',
  autoSave: true,
  sessionTimeout: 30,
  twoFactorEnabled: false,
  timezone: 'Indian/Antananarivo',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  itemsPerPage: 10,
  soundNotifications: true,
  desktopNotifications: false
})

const normalizeSettingsFromApi = (settings = {}) => ({
  notifications: settings.notifications ?? getDefaults().notifications,
  emailNotifications: settings.email_notifications ?? getDefaults().emailNotifications,
  language: settings.language ?? getDefaults().language,
  theme: settings.theme ?? getDefaults().theme,
  autoSave: settings.auto_save ?? getDefaults().autoSave,
  sessionTimeout: settings.session_timeout ?? getDefaults().sessionTimeout,
  twoFactorEnabled: settings.two_factor_enabled ?? getDefaults().twoFactorEnabled,
  timezone: settings.timezone ?? getDefaults().timezone,
  dateFormat: settings.date_format ?? getDefaults().dateFormat,
  timeFormat: settings.time_format ?? getDefaults().timeFormat,
  itemsPerPage: settings.items_per_page ?? getDefaults().itemsPerPage,
  soundNotifications: settings.sound_notifications ?? getDefaults().soundNotifications,
  desktopNotifications: settings.desktop_notifications ?? getDefaults().desktopNotifications
})

const serializeSettingsForApi = (settings) => ({
  language: settings.language,
  notifications: settings.notifications,
  email_notifications: settings.emailNotifications,
  theme: settings.theme,
  auto_save: settings.autoSave,
  session_timeout: settings.sessionTimeout,
  two_factor_enabled: settings.twoFactorEnabled,
  timezone: settings.timezone,
  date_format: settings.dateFormat,
  time_format: settings.timeFormat,
  items_per_page: settings.itemsPerPage,
  sound_notifications: settings.soundNotifications,
  desktop_notifications: settings.desktopNotifications
})

const Parametres = () => {
  const autoSaveTimerRef = useRef(null)
  const messageTimerRef = useRef(null)
  const { setDarkMode } = useOutletContext() || {}
  const [saveMessage, setSaveMessage] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(getDefaults)
  const hasLoadedRef = useRef(false)

  const applyTheme = (theme) => {
    if (typeof setDarkMode === 'function') {
      setDarkMode(theme === 'dark')
      return
    }

    document.body.classList.toggle('dark-mode', theme === 'dark')
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data } = await fetchUserSettings()
      const normalized = normalizeSettingsFromApi(data.settings)
      setSettings(normalized)
      applyTheme(normalized.theme)
      setStatusNote('')
    } catch {
      const defaults = getDefaults()
      setSettings(defaults)
      applyTheme(defaults.theme)
      setStatusNote('Serveur indisponible, réglages par défaut affichés.')
    } finally {
      setLoading(false)
      hasLoadedRef.current = true
    }
  }

  useEffect(() => {
    loadSettings()

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current)
      }
    }
  }, [])

  const persistSettings = async (nextSettings) => {
    try {
      setSaving(true)
      const payload = serializeSettingsForApi(nextSettings)
      const { data } = await updateUserSettings(payload)
      const normalized = normalizeSettingsFromApi(data.settings || payload)
      setSettings(normalized)
      applyTheme(normalized.theme)
      window.dispatchEvent(new Event('settings-updated'))
      setSaveMessage('Paramètres enregistrés')
      toast.success('Paramètres enregistrés')
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
      messageTimerRef.current = setTimeout(() => setSaveMessage(''), 3000)
    } catch {
      setStatusNote('Impossible d’enregistrer sur le serveur pour le moment, les changements restent visibles à l’écran.')
      toast.error('Impossible d’enregistrer les paramètres')
    } finally {
      setSaving(false)
    }
  }

  const scheduleAutoSave = (nextSettings) => {
    if (!hasLoadedRef.current || !nextSettings.autoSave) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = setTimeout(() => {
      persistSettings(nextSettings)
    }, 600)
  }

  const updateSetting = (key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'theme') {
        applyTheme(value)
      }
      scheduleAutoSave(next)
      return next
    })
  }

  const handleSave = () => {
    persistSettings(settings)
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'parametres-compte.json'
    link.click()

    URL.revokeObjectURL(url)
    toast.success('Configuration exportée')
  }

  const handleReset = async () => {
    const confirmed = window.confirm('Réinitialiser tous les paramètres aux valeurs par défaut ?')
    if (!confirmed) return

    const defaults = getDefaults()
    setSettings(defaults)
    applyTheme(defaults.theme)
    await persistSettings(defaults)
  }

  const themeLabel = useMemo(() => {
    return settings.theme === 'dark' ? 'Sombre' : 'Clair'
  }, [settings.theme])

  const groups = [
    {
      icon: <FiSun />,
      title: 'Apparence',
      description: 'Choisissez le thème, la langue et le comportement visuel de l’interface.',
      items: [
        {
          label: 'Thème',
          description: `Affichage actuel : ${themeLabel}.`,
          control: (
            <div className="theme-switcher" role="group" aria-label="Choix du thème">
              <button
                type="button"
                className={`theme-chip ${settings.theme === 'light' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'light')}
              >
                <FiSun />
                Clair
              </button>
              <button
                type="button"
                className={`theme-chip ${settings.theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'dark')}
              >
                <FiMoon />
                Sombre
              </button>
            </div>
          )
        },
        {
          label: 'Langue',
          description: 'Définit la langue principale de l’application.',
          control: (
            <select
              className="select-control"
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          )
        },
        {
          label: 'Sauvegarde automatique',
          description: 'Enregistre les changements automatiquement dès qu’ils sont modifiés.',
          control: (
            <button
              type="button"
              className={`toggle-btn ${settings.autoSave ? 'active' : ''}`}
              onClick={() => updateSetting('autoSave', !settings.autoSave)}
              aria-pressed={settings.autoSave}
              aria-label="Basculer la sauvegarde automatique"
            >
              {settings.autoSave ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          )
        }
      ]
    },
    {
      icon: <FiBell />,
      title: 'Notifications',
      description: 'Réglez les alertes visibles dans l’application et les notifications par e-mail.',
      items: [
        {
          label: 'Notifications dans l’application',
          description: 'Affiche les alertes dans la cloche du bandeau principal.',
          control: (
            <button
              type="button"
              className={`toggle-btn ${settings.notifications ? 'active' : ''}`}
              onClick={() => updateSetting('notifications', !settings.notifications)}
              aria-pressed={settings.notifications}
              aria-label="Basculer les notifications"
            >
              {settings.notifications ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          )
        },
        {
          label: 'Notifications par e-mail',
          description: 'Envoie un rappel par e-mail quand une action importante survient.',
          control: (
            <button
              type="button"
              className={`toggle-btn ${settings.emailNotifications ? 'active' : ''}`}
              onClick={() => updateSetting('emailNotifications', !settings.emailNotifications)}
              aria-pressed={settings.emailNotifications}
              aria-label="Basculer les notifications par e-mail"
            >
              {settings.emailNotifications ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          )
        }
      ]
    },
    {
      icon: <FiLock />,
      title: 'Sécurité',
      description: 'Contrôlez la durée de session et les comportements de sécurité.',
      items: [
        {
          label: 'Expiration de session',
          description: 'Déconnexion automatique après une période d’inactivité.',
          control: (
            <div className="number-input-group">
              <input
                type="number"
                min="5"
                max="240"
                step="5"
                className="number-control"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', Number(e.target.value))}
              />
              <span className="number-unit">min</span>
            </div>
          )
        },
        {
          label: 'Accès utilisateur',
          description: 'Les paramètres restent associés au compte connecté.',
          control: (
            <div className="inline-badge">
              <FiUserCheck />
              Protégé
            </div>
          )
        }
      ]
    },
    {
      icon: <FiDownload />,
      title: 'Données',
      description: 'Sauvegardez ou restaurez rapidement votre configuration.',
      items: [
        {
          label: 'Exporter la configuration',
          description: 'Télécharge un fichier JSON avec les paramètres actuels.',
          control: (
            <button type="button" className="btn btn-secondary action-btn-inline" onClick={handleExport}>
              <FiDownload />
              Exporter
            </button>
          )
        },
        {
          label: 'Réinitialiser',
          description: 'Remet les paramètres à leurs valeurs par défaut.',
          control: (
            <button type="button" className="btn btn-danger action-btn-inline" onClick={handleReset}>
              <FiRefreshCw />
              Réinitialiser
            </button>
          )
        }
      ]
    }
  ]

  if (loading) {
    return (
      <div className="page-content parametres-page">
        <div className="modern-card parametres-header">
          <div>
            <p className="section-eyebrow">Paramètres</p>
            <h1>Chargement des réglages...</h1>
            <p>Récupération de la configuration du compte en cours.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content parametres-page">
      <motion.section
        className="parametres-header modern-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="header-copy">
          <p className="section-eyebrow">Paramètres</p>
          <h1>Personnaliser l’application</h1>
          <p>
            Ajustez l’apparence, les notifications et la sécurité. Les changements sont liés à votre compte.
          </p>
        </div>

        <div className="header-icon">
          <FiSettings />
        </div>
      </motion.section>

      <AnimatePresence>
        {saveMessage && (
          <motion.div
            className="save-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <FiSave />
            <span>{saveMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {statusNote && <div className="save-message save-message-warning">{statusNote}</div>}

      <div className="settings-groups">
        {groups.map((group, groupIndex) => (
          <motion.section
            key={group.title}
            className="settings-group modern-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.08 }}
          >
            <header className="group-header">
              <div className="group-title-section">
                <div className="group-icon">{group.icon}</div>
                <div>
                  <h2>{group.title}</h2>
                  <p>{group.description}</p>
                </div>
              </div>
            </header>

            <div className="settings-items">
              {group.items.map((item) => (
                <div key={item.label} className="setting-item">
                  <div className="item-label">
                    <label>{item.label}</label>
                    <p className="item-description">{item.description}</p>
                  </div>
                  <div className="item-control">{item.control}</div>
                </div>
              ))}
            </div>
          </motion.section>
        ))}
      </div>

      <footer className="parametres-footer">
        <button onClick={handleSave} className="btn btn-primary save-btn" disabled={saving}>
          <FiSave />
          {saving ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
        </button>
      </footer>
    </div>
  )
}

export default Parametres
