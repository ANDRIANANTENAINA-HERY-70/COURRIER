import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCourrierInbox } from '../services/api'
import './Notifications.css'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchNotifications = async () => {
      try {
        const response = await fetchCourrierInbox()
        // Transformer les courriers en notifications
        const notifs = response.data.data?.map((c, idx) => ({
          id: c.id,
          title: c.objet || 'Nouveau courrier',
          message: `De: ${c.sender?.name || 'Unknown'}`,
          type: 'alert',
          created_at: c.created_at,
          is_read: false,
          priority: 'medium'
        })) || []
        setNotifications(notifs)
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setError('Impossible de charger les notifications')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [navigate])

  if (loading) {
    return <div className="loading">Chargement des notifications...</div>
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div className="header-info">
          <h1>Notifications</h1>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className="notification-item"
            >
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{notification.title}</h3>
                </div>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-date">
                  {new Date(notification.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>Aucune notification</h3>
            <p>Vous n'avez aucune notification pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications
