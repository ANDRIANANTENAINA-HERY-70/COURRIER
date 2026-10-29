import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBell, FiX, FiAlertCircle, FiCheckCircle, FiLock, FiUserPlus, FiShield } from 'react-icons/fi'
import './NotificationPanel.css'

const NotificationPanel = ({ unreadMessages, adminRequests = [], onMarkAsRead, onClearAll, onApproveRequest, onRejectRequest }) => {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const handleNotificationClick = (message) => {
    // Marquer comme lu
    onMarkAsRead(message)
    
    // Fermer le panel
    setIsOpen(false)
    
    // Naviguer vers la bonne boîte de réception selon la source
    if (message?.source === 'message') {
      navigate('/messagerie', { state: { highlightId: message.sourceId } })
      return
    }

    navigate('/courriers/entrants', { state: { highlightId: message.sourceId || message.id } })
  }

  const isPasswordResetNotification = (message) => {
    return message.type === 'password_reset_request' || 
           message.objet?.includes('🔐') ||
           message.objet?.includes('réinitialisation') ||
           message.message?.includes('mot de passe')
  }

  const isAdminRequestNotification = (request) => {
    return request.role === 'admin' || request.type === 'admin_request'
  }

  const handleAdminRequestAction = (request, action) => {
    if (action === 'approve') {
      onApproveRequest(request.id)
    } else if (action === 'reject') {
      onRejectRequest(request.id)
    }
  }

  const handleClearAll = () => {
    onClearAll()
    setIsOpen(false)
  }

  return (
    <div className="notification-panel-wrapper">
      {/* Bouton notification avec badge */}
      <motion.button
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <FiBell size={24} />
        {(unreadMessages.length + adminRequests.length) > 0 && (
          <motion.span 
            className="notification-badge"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {(unreadMessages.length + adminRequests.length) > 9 ? '9+' : (unreadMessages.length + adminRequests.length)}
          </motion.span>
        )}
      </motion.button>

      {/* Panel de notifications */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="notification-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête */}
            <div className="notification-panel-header">
              <h3>Notifications</h3>
              <button 
                className="panel-close-btn"
                onClick={() => setIsOpen(false)}
              >
                <FiX />
              </button>
            </div>

            {/* Contenu */}
            <div className="notification-panel-content">
              {unreadMessages.length === 0 && adminRequests.length === 0 ? (
                <div className="empty-notifications">
                  <FiCheckCircle className="empty-icon" />
                  <p>Aucune notification</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {/* Demandes de compte admin */}
                  <AnimatePresence>
                    {adminRequests.map((request, index) => (
                      <motion.div
                        key={`admin-${request.id}`}
                        className={`notification-item admin-request-notification`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="notification-icon admin-icon">
                          <FiShield />
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">
                            👑 Demande de compte administrateur
                          </div>
                          <div className="notification-message">
                            <strong>{request.name}</strong> ({request.email}) demande un compte admin
                          </div>
                          <div className="notification-time">
                            {request.created_at 
                              ? new Date(request.created_at).toLocaleString('fr-FR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'À l\'instant'}
                          </div>
                          <div className="admin-actions">
                            <button
                              className="btn-approve-admin"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAdminRequestAction(request, 'approve')
                              }}
                            >
                              <FiCheckCircle /> Accepter
                            </button>
                            <button
                              className="btn-reject-admin"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAdminRequestAction(request, 'reject')
                              }}
                            >
                              <FiX /> Refuser
                            </button>
                          </div>
                        </div>
                        <div className="notification-unread-dot admin-dot" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Messages normaux */}
                  <AnimatePresence>
                    {unreadMessages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        className={`notification-item ${isPasswordResetNotification(message) ? 'password-reset-notification' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: (adminRequests.length + index) * 0.05 }}
                        onClick={() => handleNotificationClick(message)}
                      >
                        <div className="notification-icon">
                          {isPasswordResetNotification(message) ? <FiLock /> : <FiAlertCircle />}
                        </div>
                        <div className="notification-content">
                          <div className="notification-title">
                            {isPasswordResetNotification(message) 
                              ? '🔐 Demande de réinitialisation' 
                              : (message.sender?.name || 'Expéditeur inconnu')
                            }
                          </div>
                          <div className="notification-message">
                            {message.objet || message.subject || message.message || message.content || 'Sans objet'}
                          </div>
                          <div className="notification-time">
                            {message.created_at 
                              ? new Date(message.created_at).toLocaleString('fr-FR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'À l\'instant'}
                          </div>
                        </div>
                        <div className="notification-unread-dot" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Pied de page */}
            {unreadMessages.length > 0 && (
              <div className="notification-panel-footer">
                <button 
                  className="clear-all-btn"
                  onClick={handleClearAll}
                >
                  Tout marquer comme lu
                </button>
                <button 
                  className="view-all-btn"
                  onClick={() => {
                    setIsOpen(false)
                    navigate('/courriers/entrants')
                  }}
                >
                  Voir tous les courriers
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay pour fermer */}
      {isOpen && (
        <div 
          className="notification-panel-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default NotificationPanel
