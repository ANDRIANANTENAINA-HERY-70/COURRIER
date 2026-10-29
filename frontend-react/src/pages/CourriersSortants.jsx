import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiPrinter,
  FiArchive,
  FiTrash2,
  FiCheck,
  FiX,
  FiMail
} from 'react-icons/fi'
import { 
  fetchCourrierSent, 
  sendCourrierWithFile, 
  fetchUsers,
  archiveCourrier,
  setCourrierPending,
  markCourrierAsRead,
  markCourrierAsUnread,
  deleteCourrier
} from '../services/api'
import './Courriers.css'

const CourriersSortants = () => {
  const demoUsers = [
    { id: 'admin@example.com', name: 'Admin Démo', email: 'admin@example.com' },
    { id: 'autre@example.com', name: 'Autre Démo', email: 'autre@example.com' },
    { id: 'demo@example.com', name: 'Directeur Démo', email: 'demo@example.com' },
    { id: 'dg@example.com', name: 'DG', email: 'dg@example.com' },
    { id: 'sg@example.com', name: 'SG', email: 'sg@example.com' },
    { id: 'courrier@example.com', name: 'Service Courrier', email: 'courrier@example.com' },
    { id: 'rh@example.com', name: 'RH', email: 'rh@example.com' },
    { id: 'drh@example.com', name: 'DRH', email: 'drh@example.com' },
    { id: 'compta@example.com', name: 'Compta', email: 'compta@example.com' },
    { id: 'tech@example.com', name: 'Technique', email: 'tech@example.com' },
    { id: 'autre2@example.com', name: 'Autre', email: 'autre2@example.com' },
  ]
  const [courriers, setCourriers] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    dateDebut: '',
    dateFin: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedCourrier, setSelectedCourrier] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('view')
  const [viewedRefs, setViewedRefs] = useState(new Set())
  const [error, setError] = useState('')
  const [notifiedIds, setNotifiedIds] = useState(new Set())
  const [users, setUsers] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [compose, setCompose] = useState({
    receiver_id: '',
    objet: '',
    message: '',
    fichiers: [],
  })
  const [showPendingModal, setShowPendingModal] = useState(false)
  const [pendingData, setPendingData] = useState({
    courrierID: null,
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })
  const [deleting, setDeleting] = useState(null)

  // Charger l'utilisateur connecté
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  // Charger depuis l'API
  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      setError('')

      // Mode démo ou utilisateur sans token : on charge une liste locale pour l'UI
      const token = localStorage.getItem('token')
      if (!token || token === 'demo-token') {
        setCourriers([])
        setUsers(demoUsers)
        setLoading(false)
        return
      }

      try {
        const [sentRes, usersRes] = await Promise.all([
          fetchCourrierSent(),
          fetchUsers()
        ])
        const data = sentRes.data.data || sentRes.data || []
        setCourriers(data.map(normalizeFromApi))
        const usersData = usersRes.data.data || usersRes.data || []
        setUsers(usersData)
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des courriers')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters])

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
      destinataire: item.receiver?.name || item.receiver?.email || item.destinataire || '',
      dateEnvoi: item.created_at || item.date_envoi || new Date().toISOString(),
      priorite: item.priorite || 'normale',
      statut: item.statut || 'envoye',
      modeEnvoi: item.modeEnvoi || 'email',
      contenu: item.message || item.contenu || '',
      suivi: item.suivi || null,
      is_read: item.is_read || false,
      pending_until: item.pending_until || null,
      fichier_path: item.fichier_path || null,
      fichier_original_name: item.fichier_original_name || null,
      fichiers_paths: fichiers_paths.length > 0 ? fichiers_paths : (item.fichier_path ? [item.fichier_path] : []),
      fichiers_count: fichiers_paths.length > 0 ? fichiers_paths.length : (item.fichier_path ? 1 : 0)
    }
  }

  const filteredCourriers = courriers.filter(courrier => {
    const matchesSearch =
      courrier.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courrier.objet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courrier.destinataire.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDateDebut = !filters.dateDebut || (courrier.dateEnvoi && new Date(courrier.dateEnvoi) >= new Date(filters.dateDebut))
    const matchesDateFin = !filters.dateFin || (courrier.dateEnvoi && new Date(courrier.dateEnvoi) <= new Date(filters.dateFin + 'T23:59:59'))

    return matchesSearch && matchesDateDebut && matchesDateFin
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCourriers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCourriers.length / itemsPerPage)

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'envoye': return <FiSend />
      case 'en_preparation': return <FiClock />
      case 'en_cours': return <FiAlertCircle />
      case 'livre': return <FiCheckCircle />
      default: return <FiSend />
    }
  }

  const getStatusText = (statut) => {
    const map = {
      'envoye': 'Envoyé',
      'en_preparation': 'En préparation',
      'en_cours': 'En cours',
      'livre': 'Livré'
    }
    return map[statut] || statut
  }

  const getStatusClass = (statut) => {
    const classes = {
      'envoye': 'info',
      'en_preparation': 'warning',
      'en_cours': 'danger',
      'livre': 'success'
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

  const resetFilters = () => {
    setFilters({
      dateDebut: '',
      dateFin: ''
    })
    setSearchTerm('')
    setCurrentPage(1)
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

  const handleRowClick = (event, courrier) => {
    if (event.target.closest('.row-actions')) return
    handleView(courrier)
  }

  const handleRowKeyDown = (event, courrier) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleView(courrier)
    }
  }

  const handleComposeChange = (e) => {
    const { name, value, files } = e.target
    if (name === 'fichiers') {
      // Convertir FileList en Array et l'ajouter à la liste existante
      setCompose(prev => ({
        ...prev,
        fichiers: [...(prev.fichiers || []), ...Array.from(files || [])]
      }))
      // Réinitialiser l'input file
      e.target.value = ''
    } else {
      setCompose(prev => ({ ...prev, [name]: value }))
    }
  }

  // Supprimer un fichier de la liste
  const removeFichier = (index) => {
    setCompose(prev => ({
      ...prev,
      fichiers: prev.fichiers.filter((_, i) => i !== index)
    }))
  }

  // Filtrer les utilisateurs par recherche
  const filteredUsers = users.filter(u => 
    `${u.name || ''} ${u.email || ''}`.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  const handleSend = async (e) => {
    e?.preventDefault()
    setError('')
    if (!compose.receiver_id) {
      setError('Choisis un destinataire existant ou saisis un email d’un utilisateur existant.')
      return
    }
    const token = localStorage.getItem('token')

    // Mode démo : on simule l’envoi et on alimente la liste localement
    if (!token || token === 'demo-token') {
      const receiver = users.find(u => String(u.id) === String(compose.receiver_id))
      const newItem = normalizeFromApi({
        id: `demo-${Date.now()}`,
        reference: `DEMO-${Date.now()}`,
        objet: compose.objet,
        receiver,
        destinataire: receiver?.name || receiver?.email || compose.receiver_email,
        message: compose.message,
        created_at: new Date().toISOString(),
        statut: 'envoye'
      })
      setCourriers(prev => [newItem, ...prev])
      setShowModal(false)
      setCompose({ receiver_id: '', receiver_email: '', objet: '', message: '', fichiers: [] })
      setError('')
      return
    }

    try {
      await sendCourrierWithFile(compose)
      setShowModal(false)
      setCompose({ receiver_id: '', receiver_email: '', objet: '', message: '', fichiers: [] })
      const res = await fetchCourrierSent()
      const data = res.data.data || res.data || []
      setCourriers(data.map(normalizeFromApi))
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi')
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
          <p><strong>Date :</strong> ${courrier.dateEnvoi 
            ? new Date(courrier.dateEnvoi).toLocaleDateString('fr-FR')
            : 'N/A'}</p>
          <p><strong>Destinataire :</strong> ${courrier.destinataire}</p>
          <p><strong>Objet :</strong> ${courrier.objet}</p>
          <p><strong>Mode :</strong> ${courrier.modeEnvoi}</p>
          <p><strong>Priorité :</strong> ${courrier.priorite}</p>
          <p><strong>Statut :</strong> ${getStatusText(courrier.statut)}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExport = () => {
    const headers = ['reference', 'dateEnvoi', 'destinataire', 'objet', 'priorite', 'statut', 'modeEnvoi', 'suivi']
    const rows = filteredCourriers.map(c =>
      headers.map(h => `"${String(c[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `courriers-sortants-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownload = (courrier) => {
    const dateFormatted = courrier.dateEnvoi 
      ? new Date(courrier.dateEnvoi).toLocaleDateString('fr-FR')
      : 'N/A'
    const headers = ['Référence', 'Date', 'Destinataire', 'Objet', 'Mode', 'Priorité', 'Statut']
    const values = [
      courrier.reference,
      dateFormatted,
      courrier.destinataire,
      courrier.objet,
      courrier.modeEnvoi,
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
  const handleArchive = async (courrierID) => {
    try {
      await archiveCourrier(courrierID)
      setCourriers(prev => prev.filter(c => c.id !== courrierID))
    } catch (err) {
      console.error('Erreur archive:', err)
      alert('Erreur lors de l\'archivage')
    }
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

  const handleMarkRead = async (courrierID) => {
    try {
      await markCourrierAsRead(courrierID)
      setCourriers(prev => prev.map(c => c.id === courrierID ? { ...c, is_read: true } : c))
      if (selectedCourrier?.id === courrierID) {
        setSelectedCourrier(prev => ({ ...prev, is_read: true }))
      }
      toast.success('Marqué comme lu')
    } catch (err) {
      console.error('Erreur marquage comme lu:', err)
      toast.error('Erreur lors du marquage du courrier')
    }
  }

  const handleMarkUnread = async (courrierID) => {
    try {
      await markCourrierAsUnread(courrierID)
      setCourriers(prev => prev.map(c => c.id === courrierID ? { ...c, is_read: false } : c))
      if (selectedCourrier?.id === courrierID) {
        setSelectedCourrier(prev => ({ ...prev, is_read: false }))
      }
      toast.success('Marqué comme non lu')
    } catch (err) {
      console.error('Erreur marquage comme non lu:', err)
      toast.error('Erreur lors du marquage du courrier')
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
        <p>Chargement des courriers sortants...</p>
      </div>
    )
  }

  return (
    <div className="courriers-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Courriers sortants</h1>
          <p>Gérez tous les courriers envoyés</p>
        </div>

        <div className="header-actions">
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { 
              setCompose({ receiver_id: '', objet: '', message: '', fichier: null })
              setUserSearchTerm('')
              setModalType('add'); 
              setShowModal(true); 
            }}
          >
            <FiSend />
            <span>Nouveau courrier</span>
          </motion.button>
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
      </motion.div>

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
            placeholder="Rechercher par référence, objet, destinataire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="results-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>{filteredCourriers.length} courrier(s) trouvé(s)</p>
      </motion.div>

      <div className="table-container">
        <table className="courriers-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Destinataire</th>
              <th>Objet</th>
              <th>Pièces</th>
              <th>Mode</th>
              <th>Suivi</th>
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
                  className={`courrier-row ${viewedRefs.has(courrier.reference) ? 'seen-row' : ''}`}
                  onClick={(event) => handleRowClick(event, courrier)}
                  onKeyDown={(event) => handleRowKeyDown(event, courrier)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Voir le détail du courrier ${courrier.reference}`}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="reference" onClick={() => handleView(courrier)}>{courrier.reference}</td>
                  <td onClick={() => handleView(courrier)}>{courrier.destinataire}</td>
                  <td onClick={() => handleView(courrier)}>{courrier.objet}</td>
                  <td
                    className="pj-count"
                    data-label="Pièces jointes"
                    onClick={() => handleView(courrier)}
                    style={{ cursor: 'pointer' }}
                  >
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
                  <td onClick={() => handleView(courrier)}>{courrier.modeEnvoi}</td>
                  <td onClick={() => handleView(courrier)}>
                    {courrier.suivi ? (
                      <span className="suivi-code">{courrier.suivi}</span>
                    ) : (
                      <span className="no-suivi">-</span>
                    )}
                  </td>
                  <td className="date-cell" onClick={() => handleView(courrier)}>
                    {courrier.dateEnvoi 
                      ? new Date(courrier.dateEnvoi).toLocaleDateString('fr-FR')
                      : 'N/A'}
                    <div className="row-actions">
                      <div className="badge-pair">
                        <span className={`badge badge-${getPriorityClass(courrier.priorite)}`}>{courrier.priorite}</span>
                        <span className={`badge badge-${getStatusClass(courrier.statut)}`}>{getStatusText(courrier.statut)}</span>
                      </div>

                      {/* Actions de base */}
                      <button
                        className="action-btn archive-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchive(courrier.id)
                        }}
                        title="Archiver"
                      >
                        <FiArchive size={16} />
                      </button>

                      {courrier.is_read ? (
                        <button
                          className="action-btn unread-btn"
                          onClick={(e) => { e.stopPropagation(); handleMarkUnread(courrier.id) }}
                          title="Marquer comme non lu"
                        >
                          <FiEyeOff size={16} />
                        </button>
                      ) : (
                        <button
                          className="action-btn read-btn"
                          onClick={(e) => { e.stopPropagation(); handleMarkRead(courrier.id) }}
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

                      <button className="action-btn download" onClick={(e) => { e.stopPropagation(); handleDownload(courrier) }} title="Télécharger"><FiDownload /></button>
                      <button className="action-btn print" onClick={(e) => { e.stopPropagation(); handlePrint(courrier) }} title="Imprimer"><FiPrinter /></button>
                      <button 
                        className="action-btn danger" 
                        onClick={(e) => { e.stopPropagation(); handleDelete(courrier.id) }} 
                        title="Supprimer"
                        disabled={deleting === courrier.id}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filteredCourriers.length > 0 && (
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
      )}

      <AnimatePresence>
        {showModal && (selectedCourrier || modalType === 'add') && (
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
              {modalType === 'view' && (
                <>
                  <div className="modal-header">
                    <h2>Détails du courrier</h2>
                    <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div className="detail-grid">
                      <div className="detail-item"><label>Référence</label><p>{selectedCourrier.reference}</p></div>
                      <div className="detail-item"><label>Date</label><p>{selectedCourrier.dateEnvoi 
                        ? new Date(selectedCourrier.dateEnvoi).toLocaleDateString('fr-FR')
                        : 'N/A'}</p></div>
                      <div className="detail-item"><label>Destinataire</label><p>{selectedCourrier.destinataire}</p></div>
                      <div className="detail-item"><label>Objet</label><p>{selectedCourrier.objet}</p></div>
                      <div className="detail-item"><label>Mode</label><p>{selectedCourrier.modeEnvoi}</p></div>
                      <div className="detail-item"><label>Statut</label><p><span className={`badge badge-${getStatusClass(selectedCourrier.statut)}`}>{getStatusText(selectedCourrier.statut)}</span></p></div>
                      <div className="detail-item"><label>Suivi</label><p>{selectedCourrier.suivi || '—'}</p></div>
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
                        <div className="signature-name">{selectedCourrier.destinataire}</div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <div className="footer-actions">
                      {selectedCourrier.is_read ? (
                        <button 
                          className="action-btn mark-unread-btn"
                          onClick={() => handleMarkUnread(selectedCourrier.id)}
                          title="Marquer comme non lu"
                        >
                          <FiX size={16} />
                          <span>Non lu</span>
                        </button>
                      ) : (
                        <button 
                          className="action-btn mark-read-btn"
                          onClick={() => handleMarkRead(selectedCourrier.id)}
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
                    <button 
                      className="action-btn danger"
                      onClick={() => handleDelete(selectedCourrier.id)}
                      disabled={deleting === selectedCourrier.id}
                      title="Supprimer"
                    >
                      <FiTrash2 size={16} />
                      <span>Supprimer</span>
                    </button>
                    <button className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                  </div>
                </>
              )}

              {modalType === 'add' && (
                <>
                  <div className="modal-header">
                    <h2>Nouveau courrier</h2>
                    <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    
                    <form className="edit-form" onSubmit={handleSend}>
                      {/* Sélection du destinataire avec liste déroulante */}
                      <div className="form-group">
                        <label>Destinataire</label>
                        <select
                          name="receiver_id"
                          value={compose.receiver_id}
                          onChange={(e) => {
                            const selectedUser = users.find(u => String(u.id) === e.target.value)
                            setCompose(prev => ({
                              ...prev,
                              receiver_id: e.target.value,
                              receiver_email: selectedUser?.email || ''
                            }))
                          }}
                          required
                          className="user-select-scroll"
                        >
                          <option value="">-- Sélectionner un destinataire --</option>
                          {users
                            .filter((u) => String(u.id) !== String(user?.id))
                            .map((user) => (
                              <option key={user.id} value={String(user.id)}>
                                {user.name || 'Sans nom'}
                              </option>
                            ))}
                        </select>
                        <small className="hint">Sélectionnez un destinataire dans la liste</small>
                      </div>

                      <div className="form-group">
                        <label>Objet</label>
                        <input
                          type="text"
                          name="objet"
                          value={compose.objet}
                          onChange={handleComposeChange}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Message</label>
                        <textarea
                          name="message"
                          rows="4"
                          value={compose.message}
                          onChange={handleComposeChange}
                          required
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label>Pièces jointes (plusieurs fichiers possibles)</label>
                        <div className="file-input-wrapper">
                          <input
                            type="file"
                            id="file-input"
                            name="fichiers"
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.xls,.xlsx,.txt"
                            onChange={handleComposeChange}
                            multiple
                            className="hidden-file-input"
                          />
                          <button
                            type="button"
                            className="btn-select-file"
                            onClick={() => document.getElementById('file-input').click()}
                          >
                            📎 Sélectionner des fichiers
                          </button>
                        </div>
                        {compose.fichiers && compose.fichiers.length > 0 && (
                          <div className="file-list">
                            <p className="file-count">✓ {compose.fichiers.length} fichier(s) sélectionné(s) :</p>
                            <div className="file-preview-grid">
                              {compose.fichiers.map((fichier, index) => {
                                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fichier.name);
                                const isPDF = /\.pdf$/i.test(fichier.name);
                                const url = URL.createObjectURL(fichier);
                                return (
                                  <div key={index} className="file-preview-item">
                                    {isImage ? (
                                      <div className="preview-image-container">
                                        <img src={url} alt={fichier.name} className="preview-image" />
                                        <button
                                          type="button"
                                          className="remove-file-btn-overlay"
                                          onClick={() => removeFichier(index)}
                                          title="Supprimer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : isPDF ? (
                                      <div className="preview-pdf-container">
                                        <div className="pdf-icon">📄</div>
                                        <button
                                          type="button"
                                          className="remove-file-btn-overlay"
                                          onClick={() => removeFichier(index)}
                                          title="Supprimer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="preview-file-container">
                                        <div className="file-icon">📎</div>
                                        <button
                                          type="button"
                                          className="remove-file-btn-overlay"
                                          onClick={() => removeFichier(index)}
                                          title="Supprimer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    )}
                                    <p className="file-name-preview">{fichier.name}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      {error && <p className="error">{error}</p>}
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                    <button className="btn-primary" onClick={handleSend}>Envoyer</button>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal pour mettre en attente */}
      <AnimatePresence>
        {showPendingModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPendingModal(false)}
          >
            <motion.div
              className="modal-content pending-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Mettre en attente le message</h2>
                <button className="close-btn" onClick={() => setShowPendingModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="pending-form">
                  <div className="form-group">
                    <label>Date de réception du message</label>
                    <input
                      type="date"
                      value={pendingData.date}
                      onChange={(e) => setPendingData({ ...pendingData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="form-group">
                    <label>Heure de réception</label>
                    <input
                      type="time"
                      value={pendingData.time}
                      onChange={(e) => setPendingData({ ...pendingData, time: e.target.value })}
                    />
                  </div>
                  <div className="pending-preview">
                    <p className="preview-label">Le message sera réactivé le:</p>
                    <p className="preview-value">
                      {new Date(`${pendingData.date}T${pendingData.time}`).toLocaleString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-secondary" 
                  onClick={() => setShowPendingModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    if (pendingData.courrierID) {
                      handleSetPending(pendingData.courrierID, `${pendingData.date} ${pendingData.time}:00`)
                    }
                  }}
                >
                  Confirmer la mise en attente
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CourriersSortants
