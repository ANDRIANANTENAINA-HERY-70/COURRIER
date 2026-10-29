import React, { useEffect, useState } from 'react'
import { FiUserPlus, FiUserCheck, FiXCircle, FiClock } from 'react-icons/fi'
import { fetchPendingRequests, approveRequest, rejectRequest } from '../../services/api'
import './AccountRequests.css'

const AccountRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

  const load = () => {
    setError('')
    setLoading(true)
    fetchPendingRequests()
      .then(({ data }) => setRequests(data.data || []))
      .catch(() => setError('Impossible de récupérer les demandes pour le moment.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      load()
    } else {
      setLoading(false)
    }
  }, [])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await approveRequest(id)
      load()
    } catch (e) {
      setError("Échec lors de l'approbation de la demande")
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id) => {
    setActionId(id)
    try {
      await rejectRequest(id)
      load()
    } catch (e) {
      setError('Impossible de refuser cette demande')
    } finally {
      setActionId(null)
    }
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="account-requests page-card">
        <div className="restricted">
          <FiUserPlus size={20} />
          <div>
            <h2>Accès restreint</h2>
            <p>Seuls les administrateurs peuvent valider les nouveaux comptes.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="account-requests page-card">
      <header className="header">
        <div>
          <p className="eyebrow">Demandes en attente</p>
          <h1>Validation des comptes</h1>
          <p className="subtitle">Approuvez ou refusez les créations de compte envoyées par les nouveaux utilisateurs.</p>
        </div>
        <div className="summary">
          <span className="pill waiting"><FiClock /> {requests.length} en attente</span>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          <p>Chargement des demandes...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="empty-state">
          <FiUserCheck size={28} />
          <h3>Aucune demande en attente</h3>
          <p>Vous serez notifié dès qu'un nouvel utilisateur soumettra une demande.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-info">
                <div className="avatar-circle">{req.name?.charAt(0)?.toUpperCase()}</div>
                <div>
                  <div className="name">{req.name}</div>
                  <div className="email">{req.email}</div>
                  <div className="role">Rôle demandé : {req.role}</div>
                </div>
              </div>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleReject(req.id)}
                  disabled={actionId === req.id}
                >
                  <FiXCircle /> Refuser
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApprove(req.id)}
                  disabled={actionId === req.id}
                >
                  <FiUserCheck />
                  {actionId === req.id ? 'Traitement...' : 'Accepter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AccountRequests
