import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiDownload,
  FiMail,
  FiSend,
  FiArchive,
  FiClock,
  FiAlertCircle
} from 'react-icons/fi'
import { fetchStatistiques } from '../services/api'
import './Statistiques.css'

const Statistiques = () => {
  const [period, setPeriod] = useState('month')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const getDefaultStats = (mode) => {
    const periodLabels = {
      week: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      month: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      year: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    }

    return {
      global: { total: 0, entrants: 0, sortants: 0, archives: 0, enAttente: 0, urgents: 0 },
      parMois: (periodLabels[mode] || periodLabels.month).map((label) => ({ periode: label, entrants: 0, sortants: 0, archives: 0 })),
      parService: [
        { service: 'Aucun service', count: 0 }
      ],
      priorites: { basse: 0, normale: 0, urgente: 0 }
    }
  }

  const normalizePeriodStats = (items = []) => items.map((item) => ({
    periode: item.periode || item.mois || item.label || '',
    entrants: item.entrants || 0,
    sortants: item.sortants || 0,
    archives: item.archives || 0
  }))

  const normalizeServiceStats = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      return [{ service: 'Aucun service', count: 0 }]
    }

    return items.map((item) => ({
      service: item.service || item.nom || 'Non attribué',
      count: item.count || 0
    }))
  }

  useEffect(() => {
    const loadStats = async ({ showLoading = false } = {}) => {
      if (showLoading) {
        setLoading(true)
      }
      setError('')
      try {
        const statsRes = await fetchStatistiques(period)
        const statsData = statsRes.data.data || {}

        const baseStats = getDefaultStats(period)
        baseStats.global = {
          total: statsData.total || 0,
          entrants: statsData.entrants || 0,
          sortants: statsData.sortants || 0,
          archives: statsData.archives || 0,
          enAttente: statsData.enAttente || 0,
          urgents: statsData.urgents || 0
        }

        if (statsData.parPeriode && Array.isArray(statsData.parPeriode)) {
          baseStats.parMois = normalizePeriodStats(statsData.parPeriode)
        }

        if (statsData.priorites) {
          baseStats.priorites = statsData.priorites
        }

        if (statsData.parService && Array.isArray(statsData.parService)) {
          baseStats.parService = normalizeServiceStats(statsData.parService)
        }

        setStats(baseStats)
      } catch (err) {
        setError(err.message || 'Erreur de chargement')
        setStats(getDefaultStats(period))
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    }

    loadStats({ showLoading: true })
    const autoReloadInterval = setInterval(() => loadStats(), 30000)
    return () => clearInterval(autoReloadInterval)
  }, [period])

  const handleExport = () => {
    if (!stats) return
    const rows = [
      ['total', stats.global.total],
      ['entrants', stats.global.entrants],
      ['sortants', stats.global.sortants],
      ['archives', stats.global.archives],
      ['enAttente', stats.global.enAttente],
      ['urgents', stats.global.urgents],
    ]
    const csv = ['kpi,valeur', ...rows.map(r => r.join(','))].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistiques-${period}-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSummary = () => {
    if (!stats) return
    const lines = [
      `Période: ${period}`,
      `Total : ${stats.global.total}`,
      `Entrants: ${stats.global.entrants}`,
      `Sortants: ${stats.global.sortants}`,
      `Archives: ${stats.global.archives}`,
      `En attente: ${stats.global.enAttente}`,
      `Urgents: ${stats.global.urgents}`
    ]
    const blob = new Blob([lines.join('\\n')], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `statistiques-${period}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalServices = stats?.parService?.reduce((sum, item) => sum + (item.count || 0), 0) || 0
  const totalPriority = stats?.global?.total || 0

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
        <p>Chargement des statistiques...</p>
      </div>
    )
  }

  return (
    <div className="statistiques-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Statistiques</h1>
          <p>Analysez l'activité de votre service courrier</p>
        </div>

        <div className="header-actions">
          <div className="period-selector">
            <button
              className={`period-btn ${period === 'week' ? 'active' : ''}`}
              onClick={() => setPeriod('week')}
            >
              Semaine
            </button>
            <button
              className={`period-btn ${period === 'month' ? 'active' : ''}`}
              onClick={() => setPeriod('month')}
            >
              Mois
            </button>
            <button
              className={`period-btn ${period === 'year' ? 'active' : ''}`}
              onClick={() => setPeriod('year')}
            >
              Année
            </button>
          </div>
          <div className="export-actions">
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadSummary}
            >
              <FiTrendingUp />
              <span>Résumé</span>
            </motion.button>
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
            >
              <FiDownload />
              <span>Exporter CSV</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div style={{ marginBottom: '1rem', color: 'var(--danger)', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="kpi-grid">
        <motion.div
          className="kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="kpi-icon total">
            <FiMail />
          </div>
          <div className="kpi-content">
            <h3>Total courriers</h3>
            <div className="kpi-value">{stats.global.total}</div>
            <span className="kpi-trend">+12% vs période précédente</span>
          </div>
        </motion.div>

        <motion.div
          className="kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="kpi-icon entrants">
            <FiSend />
          </div>
          <div className="kpi-content">
            <h3>Entrants</h3>
            <div className="kpi-value">{stats.global.entrants}</div>
            <span className="kpi-trend">+5% vs période précédente</span>
          </div>
        </motion.div>

        <motion.div
          className="kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="kpi-icon sortants">
            <FiSend />
          </div>
          <div className="kpi-content">
            <h3>Sortants</h3>
            <div className="kpi-value">{stats.global.sortants}</div>
            <span className="kpi-trend">+8% vs période précédente</span>
          </div>
        </motion.div>

        <motion.div
          className="kpi-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="kpi-icon archives">
            <FiArchive />
          </div>
          <div className="kpi-content">
            <h3>Archives</h3>
            <div className="kpi-value">{stats.global.archives}</div>
            <span className="kpi-trend">+15% vs période précédente</span>
          </div>
        </motion.div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Évolution mensuelle</h3>
            <FiBarChart2 />
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {stats.parMois.map((item, index) => (
                <div key={index} className="chart-column">
                  <div className="bars">
                    <div
                      className="bar entrants"
                      style={{ height: `${item.entrants}px` }}
                      title={`Entrants: ${item.entrants}`}
                    />
                    <div
                      className="bar sortants"
                      style={{ height: `${item.sortants}px` }}
                      title={`Sortants: ${item.sortants}`}
                    />
                    <div
                      className="bar archives"
                      style={{ height: `${item.archives}px` }}
                      title={`Archives: ${item.archives}`}
                    />
                  </div>
                  <span className="column-label">{item.periode}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          className="chart-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Répartition par service</h3>
            <FiPieChart />
          </div>
          <div className="chart-container">
            <div className="pie-chart">
              {stats.parService.map((item, index) => (
                <div key={index} className="pie-legend">
                  <span className="legend-color" style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }} />
                  <span className="legend-label">{item.service}</span>
                  <span className="legend-value">{item.count}</span>
                  <span className="legend-percent">
                    {totalServices > 0 ? Math.round((item.count / totalServices) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Statistiques détaillées */}
      <div className="details-grid">
        <motion.div
          className="details-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3>Répartition par priorité</h3>
          <div className="priority-stats">
            <div className="priority-item">
              <span className="priority-label">Basse</span>
              <div className="progress-bar">
                <div
                  className="progress success"
                  style={{ width: `${totalPriority > 0 ? (stats.priorites.basse / totalPriority) * 100 : 0}%` }}
                />
              </div>
              <span className="priority-value">{stats.priorites.basse}</span>
            </div>
            <div className="priority-item">
              <span className="priority-label">Normale</span>
              <div className="progress-bar">
                <div
                  className="progress info"
                  style={{ width: `${totalPriority > 0 ? (stats.priorites.normale / totalPriority) * 100 : 0}%` }}
                />
              </div>
              <span className="priority-value">{stats.priorites.normale}</span>
            </div>
            <div className="priority-item">
              <span className="priority-label">Urgente</span>
              <div className="progress-bar">
                <div
                  className="progress danger"
                  style={{ width: `${totalPriority > 0 ? (stats.priorites.urgente / totalPriority) * 100 : 0}%` }}
                />
              </div>
              <span className="priority-value">{stats.priorites.urgente}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="details-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>Temps de traitement moyen</h3>
          <div className="avg-time">
            <div className="time-item">
              <FiClock />
              <div>
                <span className="time-label">Courriers entrants</span>
                <span className="time-value">2.5 jours</span>
              </div>
            </div>
            <div className="time-item">
              <FiClock />
              <div>
                <span className="time-label">Courriers sortants</span>
                <span className="time-value">1.8 jours</span>
              </div>
            </div>
            <div className="time-item">
              <FiAlertCircle />
              <div>
                <span className="time-label">Urgents</span>
                <span className="time-value">4 heures</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Statistiques
