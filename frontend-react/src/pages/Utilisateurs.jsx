import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMail,
  FiShield,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle,
  FiLock,
  FiUnlock,
  FiDownload,
  FiEye
} from 'react-icons/fi'
import { fetchUsers } from '../services/api'
import { resolveAvatarSrc } from '../utils/avatar'
import { getStoredUser } from '../utils/profileSync'
import { ROLE_OPTIONS, getRoleLabel, getRoleClass, normalizeRole } from '../utils/roles'
import './Utilisateurs.css'

const Utilisateurs = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('details')
  const [resetCode, setResetCode] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' })
  const [editingRoleId, setEditingRoleId] = useState(null)
  const [newRole, setNewRole] = useState(null)
  const [failedAvatarIds, setFailedAvatarIds] = useState({})
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const refreshUsers = () => loadUsers()

    window.addEventListener('avatar-updated', refreshUsers)
    window.addEventListener('user-name-updated', refreshUsers)
    window.addEventListener('profile-updated', refreshUsers)
    window.addEventListener('users-updated', refreshUsers)

    return () => {
      window.removeEventListener('avatar-updated', refreshUsers)
      window.removeEventListener('user-name-updated', refreshUsers)
      window.removeEventListener('profile-updated', refreshUsers)
      window.removeEventListener('users-updated', refreshUsers)
    }
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchUsers()
      const storedUser = getStoredUser()
      // Normaliser les données
      const normalized = res.data.data ? res.data.data.map(u => ({
        id: u.id,
        nom: u.name?.split(' ').slice(1).join(' ') || u.name || 'N/A',
        prenom: u.name?.split(' ')[0] || 'N/A',
        email: u.email,
        role: normalizeRole(u.role || 'autre'),
        service: u.service?.name || 'N/A',
        status: u.is_active ? 'actif' : 'inactif',
        derniereConnexion: u.last_login_at ? u.last_login_at.split('T')[0] : 'Jamais',
        avatar: storedUser && (
          storedUser.id === u.id ||
          (storedUser.email && u.email && storedUser.email === u.email)
        )
          ? resolveAvatarSrc(storedUser)
          : resolveAvatarSrc(u),
        is_active: u.is_active
      })) : []
      setUsers(normalized)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedRole])

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.service.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = selectedRole === 'all' || user.role === selectedRole

    return matchesSearch && matchesRole
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const showActionMessage = (type, text, duration = 3000) => {
    setActionMessage({ type, text })
    if (duration > 0) {
      setTimeout(() => setActionMessage({ type: '', text: '' }), duration)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`⚠️ ATTENTION!\n\nÊtes-vous sûr de vouloir SUPPRIMER définitivement le compte de ${user.prenom} ${user.nom}?\n\nCette action est irréversible et le compte n'existera plus dans la base de données.`)) {
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Retirer l'utilisateur de la liste
        setUsers(users.filter(u => u.id !== user.id))
        showActionMessage('success', `✓ Compte de ${user.prenom} ${user.nom} supprimé avec succès`, 3000)
        setShowModal(false)
      } else {
        showActionMessage('error', data.message || 'Erreur lors de la suppression', 3000)
      }
    } catch (error) {
      console.error('Erreur suppression:', error)
      showActionMessage('error', 'Erreur lors de la suppression du compte', 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleStatus = async (user) => {
    const actionText = user.status === 'actif' 
      ? `Désactiver le compte de ${user.prenom} ${user.nom}?`
      : `Activer le compte de ${user.prenom} ${user.nom}?`

    if (!window.confirm(actionText)) {
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Mettre à jour l'utilisateur
        setUsers(users.map(u => 
          u.id === user.id 
            ? { ...u, status: u.status === 'actif' ? 'inactif' : 'actif', is_active: !u.is_active }
            : u
        ))
        
        // Mettre à jour l'utilisateur sélectionné si c'est le même
        if (selectedUser?.id === user.id) {
          setSelectedUser({
            ...selectedUser,
            status: selectedUser.status === 'actif' ? 'inactif' : 'actif',
            is_active: !selectedUser.is_active
          })
        }

        const newStatus = data.user.is_active ? 'activé' : 'désactivé'
        showActionMessage('success', `✓ Compte ${newStatus} avec succès`, 3000)
      } else {
        showActionMessage('error', data.message || 'Erreur lors de la modification', 3000)
      }
    } catch (error) {
      console.error('Erreur toggle status:', error)
      showActionMessage('error', 'Erreur lors de la modification du statut', 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangeRole = async (user, newRoleValue) => {
    if (newRoleValue === user.role) {
      showActionMessage('info', 'Le rôle sélectionné est identique au rôle actuel', 2000)
      return
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir changer le rôle de ${user.prenom} ${user.nom} de "${getRoleLabel(user.role)}" à "${getRoleLabel(newRoleValue)}"?`)) {
      return
    }

    setActionLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRoleValue })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Mettre à jour l'utilisateur dans la liste
        setUsers(users.map(u => 
          u.id === user.id 
            ? { ...u, role: newRoleValue }
            : u
        ))
        
        // Mettre à jour l'utilisateur sélectionné si c'est le même
        if (selectedUser?.id === user.id) {
          setSelectedUser({
            ...selectedUser,
            role: newRoleValue
          })
        }

        setEditingRoleId(null)
        showActionMessage('success', `✓ Rôle changé avec succès en "${getRoleLabel(newRoleValue)}"`, 3000)
      } else {
        showActionMessage('error', data.message || 'Erreur lors du changement de rôle', 3000)
      }
    } catch (error) {
      console.error('Erreur changement rôle:', error)
      showActionMessage('error', 'Erreur lors du changement de rôle', 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const viewResetCode = async (user) => {
    setSelectedUser(user)
    setModalType('resetCode')
    setResetCode(null)
    setActionLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/users/${user.id}/reset-code`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResetCode(data.code)
        setShowModal(true)
      } else {
        showActionMessage('error', data.message || 'Aucun code disponible', 3000)
      }
    } catch (error) {
      console.error('Erreur récupération code:', error)
      showActionMessage('error', 'Erreur lors de la récupération du code', 3000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleExport = () => {
    const headers = ['prenom', 'nom', 'email', 'role', 'service', 'status', 'derniereConnexion']
    const rows = filteredUsers.map(u =>
      headers.map(h => `"${String(u[h] ?? '').replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...rows].join('\\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `utilisateurs-${new Date().toISOString().slice(0,10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="utilisateurs-page">
      {/* Message d'action */}
      {actionMessage.text && (
        <motion.div
          className={`action-message ${actionMessage.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {actionMessage.text}
        </motion.div>
      )}

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

      {/* Chargement */}
      {loading && (
        <div className="page-loading">
          <div className="loader"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* En-tête */}
      <motion.div
            className="page-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div>
              <h1>Gestion des utilisateurs</h1>
              <p>{users.length} utilisateurs enregistrés</p>
            </div>

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
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="role-filter"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">Tous les rôles</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </motion.div>

      {/* Grille des utilisateurs */}
      <div className="users-grid">
        <AnimatePresence>
          {currentItems.map((user, index) => (
            <motion.div
              key={user.id}
              className="user-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
            >
              {/* Statut (actif/inactif) */}
              <div className="user-status">
                {user.status === 'actif' ? (
                  <span className="status-badge actif">
                    <FiCheckCircle /> actif
                  </span>
                ) : (
                  <span className="status-badge inactif">
                    <FiXCircle /> inactif
                  </span>
                )}
              </div>

              {/* Avatar */}
              {user.avatar && !failedAvatarIds[user.id] ? (
                <div className="user-avatar has-img">
                  <img
                    src={user.avatar}
                    alt={`${user.prenom} ${user.nom}`}
                    onLoad={() => setFailedAvatarIds((prev) => ({ ...prev, [user.id]: false }))}
                    onError={() => setFailedAvatarIds((prev) => ({ ...prev, [user.id]: true }))}
                  />
                </div>
              ) : (
                <div className="user-avatar">
                  {user.prenom.charAt(0)}{user.nom.charAt(0)}
                </div>
              )}

              {/* Informations utilisateur */}
              <div className="user-info">
                <h3>{user.prenom} {user.nom}</h3>
                <p className="user-email">
                  <FiMail /> {user.email}
                </p>
              </div>

              {/* Changement de rôle */}
              <div className="role-change-section role-change-card">
                <label>Changer le rôle</label>
                {editingRoleId === user.id ? (
                  <div className="role-edit-form">
                    <select
                      value={newRole || user.role}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="role-select"
                      disabled={actionLoading}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <div className="role-edit-buttons">
                      <button
                        type="button"
                        className="btn-save"
                        onClick={() => handleChangeRole(user, newRole || user.role)}
                        disabled={actionLoading}
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setEditingRoleId(null)
                          setNewRole(null)
                        }}
                        disabled={actionLoading}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="role-display">
                    <button
                      type="button"
                      className="role-badge-button"
                      onClick={() => {
                        setEditingRoleId(user.id)
                        setNewRole(user.role)
                      }}
                      disabled={actionLoading}
                    >
                      <span className={`role-badge ${getRoleClass(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="btn-edit-role"
                      onClick={() => {
                        setEditingRoleId(user.id)
                        setNewRole(user.role)
                      }}
                      disabled={actionLoading}
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="user-actions">
                {/* Activer/Désactiver */}
                <motion.button
                  className={`action-btn toggle-status ${user.status === 'actif' ? 'deactivate' : 'activate'}`}
                  title={user.status === 'actif' ? 'Désactiver le compte' : 'Activer le compte'}
                  onClick={() => toggleStatus(user)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={actionLoading}
                >
                  {user.status === 'actif' ? <FiLock /> : <FiUnlock />}
                  <span>{user.status === 'actif' ? 'Désactiver' : 'Activer'}</span>
                </motion.button>

                {/* Voir le code de réinitialisation */}
                <motion.button 
                  className="action-btn view-code"
                  title="Voir le code de réinitialisation"
                  onClick={() => viewResetCode(user)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={actionLoading}
                >
                  <FiEye />
                  <span>Code</span>
                </motion.button>

                {/* Supprimer */}
                <motion.button 
                  className="action-btn delete"
                  title="Supprimer le compte"
                  onClick={() => handleDelete(user)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={actionLoading}
                >
                  <FiTrash2 />
                  <span>Supprimer</span>
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
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

      {/* Modale */}
      <AnimatePresence>
        {showModal && selectedUser && (
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
                <h2>
                  {modalType === 'details' ? 'Détails utilisateur' : 'Code de réinitialisation'}
                </h2>
                <button type="button" className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              {modalType === 'details' ? (
                <>
                  <div className="modal-body">
                    <div className="user-details">
                      <p><strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}</p>
                      <p><strong>Email:</strong> {selectedUser.email}</p>
                      <p><strong>Service:</strong> {selectedUser.service}</p>
                      <p><strong>Statut:</strong> {selectedUser.status === 'actif' ? '✓ Actif' : '✗ Inactif'}</p>
                      <div className="role-change-section">
                        <label><strong>Rôle:</strong></label>
                        {editingRoleId === selectedUser.id ? (
                          <div className="role-edit-form">
                            <select
                              value={newRole || selectedUser.role}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="role-select"
                              disabled={actionLoading}
                            >
                              {ROLE_OPTIONS.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                            <div className="role-edit-buttons">
                              <button 
                                type="button"
                                className="btn-save" 
                                onClick={() => handleChangeRole(selectedUser, newRole || selectedUser.role)}
                                disabled={actionLoading}
                              >
                                ✓ Enregistrer
                              </button>
                              <button 
                                type="button"
                                className="btn-cancel" 
                                onClick={() => {
                                  setEditingRoleId(null)
                                  setNewRole(null)
                                }}
                                disabled={actionLoading}
                              >
                                ✗ Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="role-display">
                            <span className={`role-badge ${getRoleClass(selectedUser.role)}`}>{getRoleLabel(selectedUser.role)}</span>
                            <button 
                              type="button"
                              className="btn-edit-role" 
                              onClick={() => {
                                setEditingRoleId(selectedUser.id)
                                setNewRole(selectedUser.role)
                              }}
                              disabled={actionLoading}
                            >
                              Modifier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="modal-body reset-code-body">
                    {resetCode ? (
                      <div className="reset-code-display">
                        <p>Code de réinitialisation pour <strong>{selectedUser.email}</strong></p>
                        <div className="code-box">
                          <code className="reset-code">{resetCode}</code>
                          <motion.button
                            type="button"
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(resetCode)
                              showActionMessage('success', '✓ Code copié au presse-papiers', 2000)
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Copier
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div className="reset-code-loading">
                        <p>Chargement du code...</p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button className="btn-secondary" onClick={() => setShowModal(false)}>Fermer</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}

export default Utilisateurs
