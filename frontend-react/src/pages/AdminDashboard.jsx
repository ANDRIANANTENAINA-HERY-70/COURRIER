import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAdminUsers, fetchPendingUserRequests, toggleUserStatus, deleteUser, approveUserRequest, rejectUserRequest, fetchStatistiques } from '../services/api'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    pending_requests: 0,
    total_courriers: 0
  })
  const [users, setUsers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    const fetchAdminData = async () => {
      try {
        // Temporarily load mock data until we fix the backend
        setUsers([])
        setPendingRequests([])
        
        setStats({
          total_users: 0,
          active_users: 0,
          pending_requests: 0,
          total_courriers: 0
        })
      } catch (error) {
        console.error('Error fetching admin data:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        }
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [navigate])

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur?')) return

    try {
      await deleteUser(userId)
      setUsers(users.filter(user => user.id !== userId))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total_users: prev.total_users - 1,
        active_users: users.find(u => u.id === userId)?.is_active ? prev.active_users - 1 : prev.active_users
      }))
    } catch (error) {
      console.error('Error deleting user:', error)
      setError('Erreur lors de la suppression')
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await toggleUserStatus(userId, !currentStatus)
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        active_users: prev.active_users + (!currentStatus ? 1 : -1)
      }))
    } catch (error) {
      console.error('Error updating user status:', error)
      setError('Erreur lors de la mise à jour')
    }
  }

  const handleApproveRequest = async (requestId) => {
    try {
      await approveUserRequest(requestId)
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId))
      setStats(prev => ({
        ...prev,
        pending_requests: prev.pending_requests - 1,
        total_users: prev.total_users + 1,
        active_users: prev.active_users + 1
      }))
    } catch (error) {
      console.error('Error approving request:', error)
      setError('Erreur lors de l\'approbation')
    }
  }

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectUserRequest(requestId)
      setPendingRequests(pendingRequests.filter(r => r.id !== requestId))
      setStats(prev => ({
        ...prev,
        pending_requests: prev.pending_requests - 1
      }))
    } catch (error) {
      console.error('Error rejecting request:', error)
      setError('Erreur lors du refus')
    }
  }

  if (loading) {
    return <div className="loading">Chargement du tableau de bord admin...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Tableau de bord Administrateur</h1>
        <p>Gestion des utilisateurs et statistiques globales</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <h3>Total des utilisateurs</h3>
          <div className="stat-number">{stats.total_users}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <h3>Utilisateurs actifs</h3>
          <div className="stat-number">{stats.active_users}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">�</div>
          <h3>Demandes en attente</h3>
          <div className="stat-number">{stats.pending_requests}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <h3>Total des courriers</h3>
          <div className="stat-number">{stats.total_courriers}</div>
        </div>
      </div>

      <div className="admin-sections">
        <div className="section">
          <h2>Gestion des utilisateurs</h2>
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Date d'inscription</th>
                  <th>Statut</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td>
                      <span className={`role-badge`}>
                        {user.role || 'Utilisateur'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                        >
                          {user.is_active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-danger btn-sm"
                          disabled={user.role === 'admin'}
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="empty-state">
                <p>Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h2>Demandes de création de compte en attente</h2>
          <div className="requests-table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle demandé</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(request => (
                  <tr key={request.id}>
                    <td>{request.name}</td>
                    <td>{request.email}</td>
                    <td>
                      <span className={`role-badge`}>
                        {request.role || 'Utilisateur'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="btn btn-success btn-sm"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Refuser
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {pendingRequests.length === 0 && (
              <div className="empty-state">
                <p>Aucune demande en attente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
