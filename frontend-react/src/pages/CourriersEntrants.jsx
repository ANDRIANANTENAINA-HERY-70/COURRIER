import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiArchive,
  FiPrinter,
  FiMail,
  FiFileText,
  FiUser,
  FiCheck,
  FiX
} from 'react-icons/fi'
import { 
  fetchCourrierInbox,
  markCourrierAsRead,
  markCourrierAsUnread,
  archiveCourrier,
  setCourrierPending,
  deleteCourrier
} from '../services/api'
import './Courriers.css'

const CourriersEntrants = () => {
  const [courriers, setCourriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [user, setUser] = useState(null)
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: '',
    service: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedCourrier, setSelectedCourrier] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('view')
  const [editForm, setEditForm] = useState({ statut: '', priorite: '', notes: '' })
  const [viewedRefs, setViewedRefs] = useState(new Set())
  const [error, setError] = useState('')
  const [notifiedIds, setNotifiedIds] = useState(new Set())
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [pendingData, setPendingData] = useState({
    courrierID: null,
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  // Récupérer l'utilisateur du localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetchCourrierInbox()
        const data = res.data.data || res.data || []
        const normalized = data.map(normalizeFromApi)
        setCourriers(normalized)
        
        // Marquer les messages comme notifiés
        normalized.forEach((courrier) => {
          if (!courrier.is_read && !notifiedIds.has(courrier.id)) {
            setNotifiedIds(prev => new Set([...prev, courrier.id]))
          }
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des courriers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  // Rafraîchir automatiquement toutes les 10 secondes
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(async () => {
      try {
        const res = await fetchCourrierInbox()
        const data = res.data.data || res.data || []
        const normalized = data.map(normalizeFromApi)
        
        // Marquer les messages comme notifiés
        normalized.forEach((courrier) => {
          if (!courrier.is_read && !notifiedIds.has(courrier.id)) {
            setNotifiedIds(prev => new Set([...prev, courrier.id]))
          }
        })
        
        setCourriers(normalized)
      } catch (err) {
        // Silencieusement ignorer les erreurs de rafraîchissement
      }
    }, 10000) // Rafraîchir toutes les 10 secondes
    
    return () => clearInterval(interval)
  }, [user, notifiedIds])

  const normalizeFromApi = (item) => {
    // Parse fichiers_paths if it's a JSON string
    let fichiers_paths = [];
    if (item.fichiers_paths) {
      if (typeof item.fichiers_paths === 'string') {
        try {
          fichiers_paths = JSON.parse(item.fichiers_paths);
        } catch (e) {
          console.warn('Failed to parse fichiers_paths:', e);
          fichiers_paths = [];
        }
      } else if (Array.isArray(item.fichiers_paths)) {
        fichiers_paths = item.fichiers_paths;
      }
    }
    
    return {
      id: item.id,
      reference: item.reference || `CR-${item.id}`,
      objet: item.objet || '',
      expediteur: item.sender?.name || item.sender?.email || item.expediteur || 'Expéditeur',
      destinataire: item.receiver?.name || item.receiver?.email || item.destinataire || '',
      dateReception: item.created_at || item.date_reception || new Date().toISOString(),
      priorite: item.priorite || 'normale',
      statut: item.statut || 'en_attente',
      contenu: item.message || item.contenu || '',
      piecesJointes: Array.isArray(item.attachments) ? item.attachments.length : (item.piecesJointes || 0),
      service: item.service?.nom || item.service || '',
      is_read: item.is_read || false,
      pending_until: item.pending_until || null,
      fichier_path: item.fichier_path || null,
      fichier_original_name: item.fichier_original_name || null,
      fichiers_paths: fichiers_paths.length > 0 ? fichiers_paths : (item.fichier_path ? [item.fichier_path] : []),
      fichiers_count: fichiers_paths.length > 0 ? fichiers_paths.length : (item.fichier_path ? 1 : 0)
    }
  }

  // Filtrer par recherche et filtres
  const filteredCourriers = courriers.filter(courrier => {
    const matchesSearch =
      courrier.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courrier.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courrier.expediteur.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDateDebut = !filters.dateDebut || new Date(courrier.dateReception) >= new Date(filters.dateDebut)
    const matchesDateFin = !filters.dateFin || new Date(courrier.dateReception) <= new Date(filters.dateFin)
    const matchesService = !filters.service || courrier.service?.toLowerCase() === filters.service

    return matchesSearch && matchesDateDebut && matchesDateFin && matchesService
  })

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCourriers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCourriers.length / itemsPerPage)

  // Vérifier les permissions
  const canEdit = () => {
    if (!user) return false
    return ['admin', 'secretaire'].includes(user.role)
  }

  const canDelete = () => {
    if (!user) return false
    // Autoriser suppression pour les rôles opérationnels
    return ['admin', 'secretaire', 'directeur'].includes(user.role)
  }

  // Validation / rejet depuis un courrier de demande de compte
  const getEmailFromCourrier = (courrier) => courrier.expediteurEmail || courrier.expediteur || ''

  const purgeCourriersReq = (email) => {
    const saved = JSON.parse(localStorage.getItem('courriers') || '[]')
    const filtered = saved.filter(c => !(c.reference?.startsWith('REQ-') && (c.expediteurEmail || c.expediteur) === email))
    localStorage.setItem('courriers', JSON.stringify(filtered))
    setCourriers(prev => prev.filter(c => !(c.reference?.startsWith('REQ-') && (c.expediteurEmail || c.expediteur) === email)))
  }

  const approveAccountFromCourrier = (courrier) => {
    const email = getEmailFromCourrier(courrier)
    if (!email) return alert('Email manquant pour valider ce compte')
    const pending = JSON.parse(localStorage.getItem('pendingUsers') || '[]')
    const userPayload = pending.find(u => u.email === email)
    if (!userPayload) return alert('Aucune demande en attente pour cet email')
    const remaining = pending.filter(u => u.email !== email)
    const updatedApproved = [userPayload, ...approvedUsers]
    setPendingUsers(remaining)
    setApprovedUsers(updatedApproved)
    localStorage.setItem('pendingUsers', JSON.stringify(remaining))
    localStorage.setItem('approvedUsers', JSON.stringify(updatedApproved))
    purgeCourriersReq(email)
    alert(`Compte ${email} validé`)
  }

  const rejectAccountFromCourrier = (courrier) => {
    const email = getEmailFromCourrier(courrier)
    if (!email) return alert('Email manquant pour refuser ce compte')
    const pending = JSON.parse(localStorage.getItem('pendingUsers') || '[]')
    const remaining = pending.filter(u => u.email !== email)
    setPendingUsers(remaining)
    localStorage.setItem('pendingUsers', JSON.stringify(remaining))
    purgeCourriersReq(email)
    alert(`Compte ${email} refusé`)
  }

  const canAdd = () => {
    if (!user) return false
    return ['admin', 'secretaire', 'directeur'].includes(user.role)
  }

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'en_attente': return <FiClock />
      case 'urgent': return <FiAlertCircle />
      case 'traite': return <FiCheckCircle />
      case 'archive': return <FiArchive />
      default: return <FiMail />
    }
  }

  const getStatusText = (statut) => {
    const statusMap = {
      'en_attente': 'En attente',
      'traite': 'Traité',
      'archive': 'Archivé',
      'urgent': 'Urgent'
    }
    return statusMap[statut] || statut
  }

  const getStatusClass = (statut) => {
    const classes = {
      'en_attente': 'warning',
      'traite': 'success',
      'archive': 'info',
      'urgent': 'danger'
    }
    return classes[statut] || 'default'
  }

  const getPriorityClass = (priorite) => {
    const classes = {
      'basse': 'success',
      'normale': 'info',
      'urgente': 'danger'
    }
    return classes[priorite] || 'default'
  }

  const handleView = (courrier) => {
    if (courrier.reference) {
      setViewedRefs(prev => {
        const next = new Set(prev)
        next.add(courrier.reference)
        return next
      })
    }
    setSelectedCourrier(courrier)
    setModalType('view')
    setShowModal(true)
  }

  const handleSetPending = async (courrierID, pendingUntil) => {
    try {
      await setCourrierPending(courrierID, pendingUntil)
      setCourriers(prev => prev.map(c => c.id === courrierID ? { ...c, pending_until: pendingUntil, statut: 'en_attente' } : c))
      setShowPendingModal(false)
      setPendingData({ courrierID: null, date: new Date().toISOString().split('T')[0], time: '09:00' })
      toast.success('Message mis en attente jusqu\'au ' + pendingUntil)
    } catch (err) {
      console.error('Erreur mise en attente:', err)
      toast.error('Erreur lors de la mise en attente')
    }
  }

  const handlePrint = (courrier) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>${courrier.reference}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 8px; }
            p { margin: 4px 0; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; }
          </style>
        </head>
        <body>
          <h1>Courrier ${courrier.reference}</h1>
          <p><strong>Date :</strong> ${new Date(courrier.dateReception).toLocaleDateString('fr-FR')}</p>
          <p><strong>Expéditeur :</strong> ${courrier.expediteur}</p>
          <p><strong>Objet :</strong> ${courrier.objet}</p>
          <p><strong>Priorité :</strong> ${courrier.priorite}</p>
          <p><strong>Statut :</strong> ${getStatusText(courrier.statut)}</p>
          <p><strong>Contenu :</strong><br/> ${courrier.contenu}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExport = () => {
    const headers = ['reference', 'dateReception', 'expediteur', 'objet', 'priorite', 'statut', 'piecesJointes']
    const rows = filteredCourriers.map(c =>
      headers.map(h => `"${String(c[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `courriers-entrants-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: '',
      service: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleDownload = (courrier) => {
    const headers = ['Référence', 'Date', 'Expéditeur', 'Objet', 'Priorité', 'Statut']
    const values = [
      courrier.reference,
      new Date(courrier.dateReception).toLocaleDateString('fr-FR'),
      courrier.expediteur,
      courrier.objet,
      courrier.priorite,
      getStatusText(courrier.statut)
    ]
    const content = headers.map((h, i) => `${h}: ${values[i]}`).join('\\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${courrier.reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Actions sur les courriers
  const handleMarkAsRead = async (courrierID) => {
    try {
      await markCourrierAsRead(courrierID)
      setCourriers(prev => prev.map(c => c.id === courrierID ? { ...c, is_read: true } : c))
    } catch (err) {
      console.error('Erreur marquer comme lu:', err)
      alert('Erreur lors du marquage du courrier')
    }
  }

  const handleMarkAsUnread = async (courrierID) => {
    try {
      await markCourrierAsUnread(courrierID)
      setCourriers(prev => prev.map(c => c.id === courrierID ? { ...c, is_read: false } : c))
    } catch (err) {
      console.error('Erreur marquer comme non lu:', err)
      alert('Erreur lors du marquage du courrier')
    }
  }

  const handleArchive = async (courrierID) => {
    try {
      await archiveCourrier(courrierID)
      setCourriers(prev => prev.filter(c => c.id !== courrierID))
    } catch (err) {
      console.error('Erreur archive:', err)
      alert('Erreur lors de l\'archivage')
    }
  }

  const handleDelete = async (courrierID) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce courrier ?')) return
    setDeleting(courrierID)
    try {
      await deleteCourrier(courrierID)
      setCourriers(prev => prev.filter(c => c.id !== courrierID))
      setShowModal(false)
      toast.success('Courrier supprimé avec succès')
    } catch (err) {
      console.error('Erreur suppression:', err)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleting(null)
    }
  }

  // Déterminer le type de fichier
  const getFileType = (filename) => {
    if (!filename) return 'unknown'
    const ext = filename.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image'
    if (['pdf'].includes(ext)) return 'pdf'
    if (['doc', 'docx', 'txt', 'xls', 'xlsx'].includes(ext)) return 'document'
    return 'file'
  }

  // Afficher un aperçu du fichier
  const renderFilePreview = (courrier) => {
    if (!courrier.fichier_path) return null
    
    const fileType = getFileType(courrier.fichier_original_name)
    const fullUrl = `http://localhost:8000/storage/${courrier.fichier_path}`
    
    return (
      <div className="file-preview-section">
        {fileType === 'image' && (
          <div className="image-preview">
            <img 
              src={fullUrl} 
              alt={courrier.fichier_original_name || 'Image'} 
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        )}
        
        {fileType === 'pdf' && (
          <div className="pdf-preview">
            <div className="pdf-icon">
              <FiFileText size={48} />
              <p>Document PDF</p>
            </div>
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-view-pdf"
            >
              Ouvrir dans le navigateur
            </a>
          </div>
        )}
        
        {(fileType === 'document' || fileType === 'file') && (
          <div className="file-info">
            <div className="file-icon">
              <FiFileText size={32} />
            </div>
            <div className="file-details">
              <p className="file-name">{courrier.fichier_original_name || 'Fichier'}</p>
              <p className="file-type">{fileType === 'document' ? 'Document' : 'Fichier'}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
        <p>Chargement des courriers entrants...</p>
      </div>
    )
  }

  return (
    <div className="courriers-page">
      {/* Barre d'actions (boutons Nouveau courrier et Exporter) */}
      <motion.div
        className="actions-bar"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="actions-wrapper">
          <div className="header-actions">
            <motion.button
              className="btn-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
            >
              <FiDownload />
              <span>Exporter</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Barre de recherche et filtres */}
      <motion.div
        className="search-filter-bar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="search-wrapper">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par référence, objet, expéditeur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ×
            </button>
          )}
        </div>

        <div className="filter-actions">
          <motion.button
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter />
            <span>Filtres</span>
            {Object.values(filters).some(v => v) && (
              <span className="filter-indicator"></span>
            )}
          </motion.button>

          {(searchTerm || Object.values(filters).some(v => v)) && (
            <motion.button
              className="reset-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetFilters}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Réinitialiser
            </motion.button>
          )}
        </div>
      </motion.div>


      {/* Panneau de filtres */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Date début</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                />
              </div>

              <div className="filter-group">
                <label>Date fin</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                />
              </div>
            </div>

            {/* Filtre par service pour les admins */}
            {user?.role === 'admin' && (
              <div className="admin-filters">
                <h4>Filtres avancés</h4>
                <select
                  value={filters.service}
                  onChange={(e) => setFilters({ ...filters, service: e.target.value })}
                >
                  <option value="">Tous les services</option>
                  <option value="comptabilité">Comptabilité</option>
                  <option value="rh">Ressources Humaines</option>
                  <option value="direction">Direction</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résumé des résultats */}
      <motion.div
        className="results-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>{filteredCourriers.length} courrier(s) trouvé(s)</p>
        {user?.role === 'agent' && (
          <p className="role-note">Mode consultation seule - Lecture uniquement</p>
        )}
        {user?.role === 'directeur' && (
          <p className="role-note">Mode supervision - Actions limitées</p>
        )}
      </motion.div>

      {/* Tableau des courriers */}
      <div className="table-container">
        <table className="courriers-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Expéditeur</th>
              <th>Objet</th>
              <th>Pièces</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {currentItems.map((courrier, index) => (
                <motion.tr
                  key={courrier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`courrier-row ${courrier.statut === 'urgent' ? 'urgent-row' : ''} ${viewedRefs.has(courrier.reference) ? 'seen-row' : ''}`}
                  onClick={() => handleView(courrier)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="reference" data-label="Référence">{courrier.reference}</td>
                  <td data-label="Expéditeur">{courrier.expediteur}</td>
                  <td className="objet" title={courrier.objet} data-label="Objet">
                    {courrier.objet.length > 30 ? courrier.objet.substring(0, 30) + '...' : courrier.objet}
                  </td>
                  <td className="pj-count" data-label="Pièces jointes">
                    {(courrier.fichier_path || (courrier.fichiers_paths && courrier.fichiers_paths.length > 0)) && (
                      <div className="pj-badges-container">
                        {courrier.fichiers_paths && courrier.fichiers_paths.length > 0 ? (
                          courrier.fichiers_paths.map((path, idx) => {
                            const filename = courrier.fichier_original_name || path.split('/').pop();
                            const type = getFileType(filename);
                            return (
                              <span key={idx} className={`pj-badge pj-badge-${type}`} title={filename}>
                                {type === 'image' && <>🖼️ Image</> || 
                                 type === 'pdf' && <>📄 PDF</> || 
                                 type === 'document' && <>📋 Doc</> || 
                                 <>📎 Fichier</>}
                              </span>
                            );
                          })
                        ) : (
                          <span className={`pj-badge pj-badge-${getFileType(courrier.fichier_original_name)}`} title={courrier.fichier_original_name}>
                            {(() => {
                              const type = getFileType(courrier.fichier_original_name);
                              if (type === 'image') return <>🖼️ Image</>
                              if (type === 'pdf') return <>📄 PDF</>
                              if (type === 'document') return <>📋 Doc</>
                              return <>📎 Fichier</>
                            })()}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td data-label="Date" className="date-cell">
                    {courrier.dateReception 
                      ? new Date(courrier.dateReception).toLocaleDateString('fr-FR') 
                      : 'N/A'}
                    <div className="row-actions">
                      <div className="badge-pair">
                        <span className={`badge badge-${getPriorityClass(courrier.priorite)}`}>{courrier.priorite}</span>
                        <span className={`badge badge-${getStatusClass(courrier.statut)}`}>{getStatusText(courrier.statut)}</span>
                      </div>
                      
                      {/* Actions sur les courriers */}
                      <button
                        className="action-btn archive-btn"
                        onClick={(e) => { e.stopPropagation(); handleArchive(courrier.id) }}
                        title="Archiver"
                      >
                        <FiArchive size={16} />
                      </button>

                      <button
                        className="action-btn danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(courrier.id)
                        }}
                        title="Supprimer"
                        disabled={deleting === courrier.id}
                      >
                        <FiTrash2 size={16} />
                      </button>

                      {courrier.is_read ? (
                        <button
                          className="action-btn unread-btn"
                          onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(courrier.id) }}
                          title="Marquer comme non lu"
                        >
                          <FiEyeOff size={16} />
                        </button>
                      ) : (
                        <button
                          className="action-btn read-btn"
                          onClick={(e) => { e.stopPropagation(); handleMarkAsRead(courrier.id) }}
                          title="Marquer comme lu"
                        >
                          <FiMail size={16} />
                        </button>
                      )}

                      <button
                        className="action-btn pending-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPendingData({ courrierID: courrier.id, date: new Date().toISOString().split('T')[0], time: '09:00' })
                          setShowPendingModal(true)
                        }}
                        title="Mettre en attente"
                      >
                        <FiClock size={16} />
                        {courrier.pending_until && <span className="pending-dot"></span>}
                      </button>

                      <button
                        className="action-btn download"
                        onClick={(e) => { e.stopPropagation(); handleDownload(courrier) }}
                        title="Télécharger"
                      >
                        <FiDownload />
                      </button>

                      <button
                        className="action-btn print"
                        onClick={(e) => { e.stopPropagation(); handlePrint(courrier) }}
                        title="Imprimer"
                      >
                        <FiPrinter />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {filteredCourriers.length === 0 && (
          <div className="no-results">
            <FiMail size={48} />
            <h3>Aucun courrier trouvé</h3>
            <p>Essayez de modifier vos filtres de recherche</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {
        filteredCourriers.length > 0 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <FiChevronLeft />
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <FiChevronRight />
            </button>
          </div>
        )
      }

      {/* Modal de visualisation */}
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
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {modalType === 'view' && (
                <>
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
                        <p>{selectedCourrier.dateReception 
                          ? new Date(selectedCourrier.dateReception).toLocaleDateString('fr-FR')
                          : 'N/A'}
                        </p>
                      </div>
                      <div className="detail-item">
                        <label>Expéditeur</label>
                        <p>{selectedCourrier.expediteur}</p>
                      </div>
                      <div className="detail-item">
                        <label>Destinataire</label>
                        <p>{selectedCourrier.destinataire}</p>
                      </div>
                      <div className="detail-item">
                        <label>Objet</label>
                        <p>{selectedCourrier.objet}</p>
                      </div>
                      <div className="detail-item">
                        <label>Statut</label>
                        <p><span className={`badge badge-${getStatusClass(selectedCourrier.statut)}`}>
                          {getStatusIcon(selectedCourrier.statut)}
                          {getStatusText(selectedCourrier.statut)}
                        </span></p>
                      </div>
                      <div className="detail-item full-width">
                        <label>Contenu</label>
                        <p className="contenu">{selectedCourrier.contenu}</p>
                      </div>
                      {selectedCourrier.fichier_path && (
                        <>
                          <div className="detail-item full-width">
                            <label>Fichier/Pièce jointe</label>
                            {renderFilePreview(selectedCourrier)}
                            <a
                              href={`http://localhost:8000/storage/${selectedCourrier.fichier_path}`}
                              download={selectedCourrier.fichier_original_name || 'fichier'}
                              className="btn-download-primary"
                            >
                              <FiDownload size={18} />
                              <span>Télécharger</span>
                            </a>
                          </div>
                        </>
                      )}
                      {selectedCourrier.fichiers_paths && selectedCourrier.fichiers_paths.length > 0 && (
                        <div className="detail-item full-width">
                          <label>Pièces jointes</label>
                          <div className="pj-badges-container">
                            {selectedCourrier.fichiers_paths.map((path, idx) => {
                              const filename = selectedCourrier.fichier_original_name || path.split('/').pop();
                              const type = getFileType(filename);
                              return (
                                <div key={idx} className="file-preview-item">
                                  {renderFilePreview({ fichier_path: path, fichier_original_name: filename })}
                                  <a
                                    href={`http://localhost:8000/storage/${path}`}
                                    download={filename}
                                    className="btn-download-primary"
                                    style={{ marginTop: '0.5rem' }}
                                  >
                                    <FiDownload size={14} />
                                    <span>{filename}</span>
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="detail-item full-width signature-section">
                        <div className="signature-line"></div>
                        <p className="signature-text">Signature du courrier</p>
                        <div className="signature-name">{selectedCourrier.expediteur}</div>
                      </div>
                    </div>
                  </div>
                    <div className="modal-footer">
                      <div className="footer-actions">
                        {selectedCourrier.is_read ? (
                          <button 
                            className="action-btn mark-unread-btn"
                            onClick={() => {
                              handleMarkAsUnread(selectedCourrier.id)
                              setShowModal(false)
                            }}
                            title="Marquer comme non lu"
                          >
                            <FiX size={16} />
                            <span>Non lu</span>
                          </button>
                        ) : (
                          <button 
                            className="action-btn mark-read-btn"
                            onClick={() => {
                              handleMarkAsRead(selectedCourrier.id)
                              setShowModal(false)
                            }}
                            title="Marquer comme lu"
                          >
                            <FiCheck size={16} />
                            <span>Lu</span>
                          </button>
                        )}
                        <button 
                          className="action-btn pending-modal-btn"
                          onClick={() => {
                            setPendingData({ courrierID: selectedCourrier.id, date: new Date().toISOString().split('T')[0], time: '09:00' })
                            setShowModal(false)
                            setShowPendingModal(true)
                          }}
                          title="Mettre en attente"
                        >
                          <FiClock size={16} />
                          <span>Mettre en attente</span>
                        </button>
                      </div>
                      <div className="right-actions">
                        <button
                          className="action-btn danger"
                          onClick={() => handleDelete(selectedCourrier.id)}
                          title="Supprimer"
                          disabled={deleting === selectedCourrier.id}
                        >
                          <FiTrash2 size={16} />
                          <span>Supprimer</span>
                        </button>
                        <button className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                      </div>
                    </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Modal */}
      <AnimatePresence>
        {showPendingModal && (
          <motion.div 
            className="modal-overlay" 
            onClick={() => setShowPendingModal(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="pending-modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="modal-header">
                <h2>Mettre en attente</h2>
                <button className="close-btn" onClick={() => setShowPendingModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="pending-form">
                  <div className="form-group">
                    <label>Date de réactivation</label>
                    <input 
                      type="date" 
                      value={pendingData.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPendingData({ ...pendingData, date: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Heure</label>
                    <input 
                      type="time" 
                      value={pendingData.time}
                      onChange={(e) => setPendingData({ ...pendingData, time: e.target.value })}
                    />
                  </div>
                  <div className="pending-preview">
                    <strong>Réactivation prévue:</strong><br/>
                    {new Date(`${pendingData.date}T${pendingData.time}`).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <div className="right-actions">
                  <button className="btn-secondary" onClick={() => setShowPendingModal(false)}>Annuler</button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      handleSetPending(pendingData.courrierID, `${pendingData.date} ${pendingData.time}:00`)
                      setShowPendingModal(false)
                    }}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  )
}

export default CourriersEntrants
