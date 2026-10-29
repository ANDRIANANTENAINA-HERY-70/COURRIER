import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FiMail,
  FiSend,
  FiAlertCircle,
  FiTrendingUp,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiDownload,
  FiMoreVertical
} from 'react-icons/fi'
import { fetchCourrierInbox, fetchCourrierSent, fetchCourrierArchives, fetchStatistiques } from '../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    entrants: 0,
    sortants: 0,
    total: 0,
    archives: 0,
    enAttente: 0,
    urgents: 0,
    utilisateursActifs: 0,
    documentsNumerises: 0,
    tauxTraitement: 0
  })

  const VIEWED_KEY = 'viewedDashboard'
  const [recentCourriers, setRecentCourriers] = useState([])
  const [selectedCourrier, setSelectedCourrier] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [viewedRefs, setViewedRefs] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY) || '[]'))
    } catch {
      return new Set()
    }
  })
  const [recentActivities, setRecentActivities] = useState([])
  const [error, setError] = useState(null)

  const loadDashboard = async () => {
    try {
      const [inboxRes, sentRes, archivesRes] = await Promise.all([
        fetchCourrierInbox(),
        fetchCourrierSent(),
        fetchCourrierArchives()
      ])

      const inboxCount = inboxRes.data.data?.length || 0
      const sentCount = sentRes.data.data?.length || 0
      const archivesCount = archivesRes.data.data?.length || 0
      let statsData = {}

      try {
        const statsRes = await fetchStatistiques()
        statsData = statsRes.data.data || {}
      } catch (statsErr) {
        console.warn('Statistiques indisponibles sur le dashboard:', statsErr)
      }

      setStats({
        entrants: statsData.entrants || inboxCount,
        sortants: statsData.sortants || sentCount,
        total: statsData.total || (inboxCount + sentCount),
        archives: statsData.archives || archivesCount,
        enAttente: statsData.enAttente || 0,
        urgents: statsData.urgents || 0,
        utilisateursActifs: statsData.utilisateursActifs || 0,
        documentsNumerises: statsData.documentsNumerises || 0,
        tauxTraitement: statsData.tauxTraitement || 0
      })

      const allCourriers = [
        ...(inboxRes.data.data || []).map(c => ({ ...c, type: 'reçu', expediteur: c.sender?.name || 'Expéditeur' })),
        ...(sentRes.data.data || []).map(c => ({ ...c, type: 'envoyé', expediteur: c.receiver?.name || 'Destinataire' }))
      ]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)

      const normalizedCourriers = allCourriers.map(c => ({
        id: c.id,
        reference: `COU-${c.id}`,
        objet: c.objet || 'Sans titre',
        expediteur: c.expediteur,
        date: c.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        statut: 'traite',
        priorite: 'normale'
      }))
      setRecentCourriers(normalizedCourriers)

      const activities = []
      normalizedCourriers.forEach((c, idx) => {
        if (idx < 3) {
          activities.push({
            id: `act-${c.id}`,
            action: c.type === 'reçu' ? 'Courrier reçu' : 'Courrier envoyé',
            details: `${c.objet} - ${c.expediteur}`,
            time: getTimeAgo(c.date),
            icon: c.type === 'reçu' ? 'mail' : 'send'
          })
        }
      })

      if (archivesCount > 0) {
        activities.push({
          id: 'act-archive',
          action: 'Courrier archivé',
          details: `${archivesCount} courrier(s) archivé(s)`,
          time: 'Récemment',
          icon: 'check'
        })
      }
      setRecentActivities(activities)
    } catch (err) {
      console.error('Erreur lors du chargement du tableau de bord:', err)
      setError('Erreur lors du chargement des données. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    const refreshTimer = setInterval(loadDashboard, 30000)
    return () => clearInterval(refreshTimer)
  }, [])

  const statCards = [
    { title: 'Courriers Entrants', value: stats.entrants, emoji: '📥', emojiLabel: 'Courriers Entrants', color: 'primary', change: '', changeText: 'courriers reçus', target: '/courriers/entrants' },
    { title: 'Courriers Sortants', value: stats.sortants, emoji: '📤', emojiLabel: 'Courriers Sortants', color: 'success', change: '', changeText: 'courriers envoyés', target: '/courriers/sortants' },
    { title: 'Total courriers ', value: stats.total, emoji: '📊', emojiLabel: 'Total courriers et archives', color: 'info', change: '', changeText: 'courriers totaux', target: '/courriers' },
    { title: 'Archives', value: stats.archives, emoji: '📁', emojiLabel: 'Archives', color: 'warning', change: '', changeText: 'courriers archivés', target: '/archives' }
  ]

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays < 7) return `Il y a ${diffDays} j`
    return date.toLocaleDateString('fr-FR')
  }

  const handleCardClick = (target) => {
    if (!target) return
    navigate(target)
  }

  const handleView = (courrier) => {
    if (courrier.reference) {
      setViewedRefs(prev => {
        const next = new Set(prev)
        next.add(courrier.reference)
        localStorage.setItem(VIEWED_KEY, JSON.stringify([...next]))
        return next
      })
    }
    setSelectedCourrier(courrier)
    setShowModal(true)
  }

  const handleDownload = (courrier) => {
    const dateFormatted = courrier.date 
      ? new Date(courrier.date).toLocaleDateString('fr-FR')
      : 'N/A'
    const content = `Courrier ${courrier.reference}\nObjet: ${courrier.objet}\nExpéditeur: ${courrier.expediteur}\nDate: ${dateFormatted}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${courrier.reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const getStatusClass = (statut) => {
    const classes = {
      'traite': 'success',
      'en_attente': 'warning',
      'archive': 'info',
      'urgent': 'danger'
    }
    return classes[statut] || 'default'
  }

  const getStatusText = (statut) => {
    const texts = {
      'traite': 'Traité',
      'en_attente': 'En attente',
      'archive': 'Archivé',
      'urgent': 'Urgent'
    }
    return texts[statut] || statut
  }

  const getPriorityClass = (priorite) => {
    const classes = {
      'urgente': 'danger',
      'normale': 'warning',
      'basse': 'success'
    }
    return classes[priorite] || 'default'
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'mail': return <FiMail />
      case 'send': return <FiSend />
      case 'check': return <FiCheckCircle />
      case 'alert': return <FiAlertCircle />
      default: return <FiFileText />
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      {/* En-tête avec animation */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1>Tableau de bord</h1>
          <p className="welcome-message">
            Bienvenue dans votre espace de gestion de courrier
          </p>
        </div>

        <motion.div
          className="date-badge glass"
          whileHover={{ scale: 1.05 }}
        >
          <FiTrendingUp />
          <span>{new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </motion.div>
      </motion.div>

      {error && (
        <div style={{ marginBottom: '1rem', color: 'var(--danger)', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Cartes de statistiques */}
      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        {statCards.map((card, index) => {
          const Icon = card.icon
          const Emoji = card.emoji
          return (
            <motion.div
              key={index}
              className={`stat-card modern-card ${card.color}`}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: {
                  y: 0,
                  opacity: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 100
                  }
                }
              }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              onClick={() => handleCardClick(card.target)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCardClick(card.target) }}
            >
              <div className="stat-icon">
                {Emoji
                  ? <span className="emoji-icon" role="img" aria-label={card.emojiLabel || card.title} style={{ fontSize: '1.6rem' }}>{Emoji}</span>
                  : Icon && <Icon />}
              </div>
              <div className="stat-content">
                <h3>{card.title}</h3>
                <div className="stat-value">{card.value.toLocaleString()}</div>
                <div className="stat-footer">
                  <span className="stat-change">{card.change}</span>
                  <span className="stat-change-text">{card.changeText}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Graphiques et tableaux */}
      <div className="dashboard-grid">
        {/* Courriers récents */}
        <motion.div
          className="recent-courriers modern-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h2>Courriers récents</h2>
            <motion.button
              className="btn-icon"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/courriers/entrants')}
            >
              <FiMoreVertical />
            </motion.button>
          </div>

          <div className="table-responsive">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Objet</th>
                  <th>Expéditeur</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCourriers.map((courrier, index) => (
                  <motion.tr
                    key={courrier.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + (index * 0.05) }}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    className={viewedRefs.has(courrier.reference) ? 'seen-row' : ''}
                    onClick={() => handleView(courrier)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="reference">{courrier.reference}</td>
                    <td>{courrier.objet}</td>
                    <td>{courrier.expediteur}</td>
                    <td className="date-cell">
                      {courrier.date 
                        ? new Date(courrier.date).toLocaleDateString('fr-FR')
                        : 'N/A'}
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="action-btn download"
                          onClick={() => handleDownload(courrier)}
                          title="Télécharger"
                        >
                          <FiDownload />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Activité récente */}
        <motion.div
          className="activity-summary modern-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <h2>Activité récente</h2>
          </div>

          <div className="activity-list">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  className="activity-item"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (index * 0.1) }}
                  whileHover={{ x: 5 }}
                >
                  <div className={`activity-icon ${activity.icon}`}>
                    {getActivityIcon(activity.icon)}
                  </div>
                  <div className="activity-content">
                    <p><strong>{activity.action}</strong> {activity.details}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-activities">
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pied de page avec statistiques */}
      <motion.div
        className="dashboard-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="footer-stats">
          <div className="stat-item glass">
            <FiUsers />
            <div>
              <span className="label">Utilisateurs actifs</span>
              <span className="value">{stats.utilisateursActifs}</span>
            </div>
          </div>
          <div className="stat-item glass">
            <FiFileText />
            <div>
              <span className="label">Documents numérisés</span>
              <span className="value">{stats.documentsNumerises.toLocaleString()}</span>
            </div>
          </div>
          <div className="stat-item glass">
            <FiCheckCircle />
            <div>
              <span className="label">Taux de traitement</span>
              <span className="value">{stats.tauxTraitement}%</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && selectedCourrier && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Détails du courrier</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Référence</label>
                    <p>{selectedCourrier.reference}</p>
                  </div>
                  <div className="detail-item">
                    <label>Date</label>
                    <p>{new Date(selectedCourrier.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="detail-item">
                    <label>Expéditeur</label>
                    <p>{selectedCourrier.expediteur}</p>
                  </div>
                  <div className="detail-item">
                    <label>Objet</label>
                    <p>{selectedCourrier.objet}</p>
                  </div>
                  <div className="detail-item">
                    <label>Statut</label>
                    <p><span className={`badge badge-${getStatusClass(selectedCourrier.statut)}`}>
                      {getStatusText(selectedCourrier.statut)}
                    </span></p>
                  </div>
                  <div className="detail-item full-width">
                    <label>Actions rapides</label>
                    <div className="modal-actions">
                      <button className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                      <button className="btn-primary" onClick={() => navigate('/courriers/entrants')}>Ouvrir la fiche</button>
                      <button className="btn-secondary" onClick={() => handleDownload(selectedCourrier)}>
                        <FiDownload />
                        Télécharger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard
