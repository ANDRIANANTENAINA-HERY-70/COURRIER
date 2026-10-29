import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiAlertCircle, FiX, FiArrowRight } from 'react-icons/fi'
import './IncomingMessageToast.css'

const IncomingMessageToast = ({ message, onDismiss }) => {
  const navigate = useNavigate()

  const handleClickToast = () => {
    if (message?.source === 'message') {
      navigate('/messagerie', { state: { highlightId: message.sourceId } })
    } else {
      navigate('/courriers/entrants', { state: { highlightId: message.sourceId || message.id } })
    }
    onDismiss()
  }

  return (
    <motion.div
      className="incoming-message-toast"
      initial={{ opacity: 0, x: 400, y: 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 400, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleClickToast}
    >
      <div className="toast-icon">
        <FiAlertCircle size={20} />
      </div>

      <div className="toast-content">
        <div className="toast-title">
          {message?.source === 'message' ? 'Nouveau message!' : 'Nouveau courrier!'}
        </div>
        <div className="toast-message">
          De: <strong>{message.sender?.name || 'Expéditeur'}</strong>
        </div>
        <div className="toast-subject">
          "{message.objet || message.subject || 'Sans objet'}"
        </div>
      </div>

      <div className="toast-action">
        <FiArrowRight size={16} />
      </div>

      <button
        className="toast-close"
        onClick={(e) => {
          e.stopPropagation()
          onDismiss()
        }}
      >
        <FiX size={16} />
      </button>
    </motion.div>
  )
}

export default IncomingMessageToast
