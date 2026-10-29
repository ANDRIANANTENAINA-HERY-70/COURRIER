import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch,
  FiDownload,
  FiEye,
  FiCalendar,
  FiUser,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
  FiFolder,
  FiFilter,
  FiX,
  FiArchive,
  FiTrash2
} from 'react-icons/fi'
import { fetchCourrierArchives, deleteCourrier } from '../services/api'
import './Archives.css'

const normalizeFromApi = (item) => ({
  id: item.id,
  reference: `ARCH-${item.id}`,
  titre: item.objet || 'Sans titre',
  type: 'Courrier',
  date: item.created_at ? item.created_at.split('T')[0] : item.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  taille: '0 Ko',
  expediteur: item.sender?.name || item.sender?.email || 'Expéditeur inconnu',
  cote: `${item.sender_id}-${item.id}`,
  extension: 'TXT'
})

const Archives = () => {
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [selectedArchive, setSelectedArchive] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchCourrierArchives()
      const normalized = res.data.data.map(normalizeFromApi)
      setArchives(normalized)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des archives')
    } finally {
      setLoading(false)
    }
  }

  // Réinitialiser la pagination à chaque changement de filtre/recherche
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedYear, selectedType])

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Courrier': return <FiFileText />
      case 'Facture': return <FiTag />
      case 'Contrat': return <FiFileText />
      case 'Rapport': return <FiFolder />
      case 'Devis': return <FiFileText />
      default: return <FiArchive />
    }
  }

  const getTypeClass = (type) => {
    const classes = {
      'Courrier': 'type-courrier',
      'Facture': 'type-facture',
      'Contrat': 'type-contrat',
      'Rapport': 'type-rapport',
      'Devis': 'type-devis'
    }
    return classes[type] || 'type-default'
  }

  const years = ['all', ...new Set(archives.map(a => new Date(a.date).getFullYear().toString()))]
  const types = ['all', ...new Set(archives.map(a => a.type))]

  const filteredArchives = archives.filter(archive => {
    const matchesSearch =
      archive.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.expediteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      archive.cote.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesYear = selectedYear === 'all' || new Date(archive.date).getFullYear().toString() === selectedYear
    const matchesType = selectedType === 'all' || archive.type === selectedType

    return matchesSearch && matchesYear && matchesType
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredArchives.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredArchives.length / itemsPerPage)

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet archive ?')) return
    setDeleting(id)
    try {
      await deleteCourrier(id)
      setArchives(archives.filter(a => a.id !== id))
      setShowModal(false)
      setError('')
      // Show success message if toast is available
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success('Archive supprimée avec succès')
      }
    } catch (err) {
      console.error('Erreur suppression:', err)
      setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'archive')
    } finally {
      setDeleting(null)
    }
  }

  const resetFilters = () => {
    setSelectedYear('all')
    setSelectedType('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleView = (archive) => {
    setSelectedArchive(archive)
    setShowModal(true)
  }

  const handleDownload = (archive) => {
    const dateFormatted = archive.date
      ? new Date(archive.date).toLocaleDateString('fr-FR')
      : 'N/A'
    const lines = [
      `Référence: ${archive.reference}`,
      `Titre: ${archive.titre}`,
      `Type: ${archive.type}`,
      `Date: ${dateFormatted}`,
      `Expéditeur: ${archive.expediteur}`,
      `Cote: ${archive.cote}`,
      `Taille: ${archive.taille}`,
      `Extension: ${archive.extension}`
    ]
    const blob = new Blob([lines.join('\\n')], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${archive.reference}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    const headers = ['reference', 'titre', 'type', 'date', 'expediteur', 'cote', 'taille', 'extension']
    const rows = filteredArchives.map(a =>
      headers.map(h => `"${String(a[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `archives-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loader"></div>
        <p>Chargement des archives...</p>
      </div>
    )
  }

  return (
    <div className="archives-page">
      {/* Affichage des erreurs */}
      {error && (
        <motion.div
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* En-tête */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1>Archives</h1>
          <p className="welcome-message">
            Consultez tous les documents archivés
          </p>
        </div>

        <motion.div
          className="stats-badge"
          whileHover={{ scale: 1.05 }}
        >
          <FiArchive />
          <span>{archives.length} documents</span>
        </motion.div>

        <motion.button
          className="btn-secondary export-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExport}
        >
          <FiDownload />
          <span>Exporter</span>
        </motion.button>
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
            placeholder="Rechercher par référence, titre, cote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FiX />
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
            {(selectedYear !== 'all' || selectedType !== 'all') && (
              <span className="filter-indicator"></span>
            )}
          </motion.button>

          {(searchTerm || selectedYear !== 'all' || selectedType !== 'all') && (
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
            transition={{ duration: 0.3 }}
          >
            <div className="filters-grid">
              <div className="filter-group">
                <label>Année</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="all">Toutes années</option>
                  {years.filter(y => y !== 'all').map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Type de document</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="all">Tous types</option>
                  {types.filter(t => t !== 'all').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Résumé des résultats */}
      <motion.div
        className="results-summary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p>{filteredArchives.length} document(s) trouvé(s)</p>
      </motion.div>

      {/* Grille des archives */}
      {filteredArchives.length > 0 ? (
        <motion.div
          className="archives-grid"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {currentItems.map((archive, index) => (
            <motion.div
              key={archive.id}
              className="archive-card modern-card"
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
            >
              <div className="archive-icon">
                {getTypeIcon(archive.type)}
              </div>

              <div className="archive-content">
                <div className="archive-header">
                  <h3 title={archive.titre}>{archive.titre}</h3>
                  <span className="archive-reference">{archive.reference}</span>
                </div>

                <div className="archive-meta">
                  <span className="meta-item">
                    <FiCalendar /> {archive.date 
                      ? new Date(archive.date).toLocaleDateString('fr-FR')
                      : 'N/A'}
                  </span>
                  <span className="meta-item">
                    <FiUser /> {archive.expediteur}
                  </span>
                </div>

                <div className="archive-footer">
                  <span className={`type-badge ${getTypeClass(archive.type)}`}>
                    {archive.type}
                  </span>
                  <span className="archive-size">{archive.taille}</span>
                  <span className="archive-cote">{archive.cote}</span>
                </div>
              </div>

              <div className="archive-actions">
                <motion.button
                  className="action-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Voir"
                  onClick={() => handleView(archive)}
                >
                  <FiEye />
                </motion.button>
                <motion.button
                  className="action-btn"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Télécharger"
                  onClick={() => handleDownload(archive)}
                >
                  <FiDownload />
                </motion.button>
                <motion.button
                  className="action-btn danger"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Supprimer"
                  onClick={() => handleDelete(archive.id)}
                  disabled={deleting === archive.id}
                >
                  {deleting === archive.id ? '...' : <FiTrash2 />}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Message si aucun résultat */
        <motion.div
          className="no-results"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FiFolder size={48} />
          <h3>Aucun document trouvé</h3>
          <p>Essayez de modifier vos filtres de recherche</p>
        </motion.div>
      )}

      {/* Pagination */}
      {filteredArchives.length > 0 && (
        <motion.div
          className="pagination"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            <FiChevronLeft /> Précédent
          </button>

          <span className="pagination-info">
            Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong>
          </span>

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Suivant <FiChevronRight />
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && selectedArchive && (
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
                <h2>Détails de l'archive</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-grid">
                  <div className="detail-item"><label>Référence</label><p>{selectedArchive.reference}</p></div>
                  <div className="detail-item"><label>Titre</label><p>{selectedArchive.titre}</p></div>
                  <div className="detail-item"><label>Type</label><p>{selectedArchive.type}</p></div>
                  <div className="detail-item"><label>Date</label><p>{selectedArchive.date 
                    ? new Date(selectedArchive.date).toLocaleDateString('fr-FR')
                    : 'N/A'}</p></div>
                  <div className="detail-item"><label>Expéditeur</label><p>{selectedArchive.expediteur}</p></div>
                  <div className="detail-item"><label>Cote</label><p>{selectedArchive.cote}</p></div>
                  <div className="detail-item"><label>Taille</label><p>{selectedArchive.taille}</p></div>
                  <div className="detail-item"><label>Extension</label><p>{selectedArchive.extension}</p></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                <button className="btn-primary" onClick={() => handleDownload(selectedArchive)}><FiDownload /> Télécharger</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Archives
