import React from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import './SuccessAlert.css'

const SuccessAlert = ({ message, onDismiss }) => {
  if (!message || (typeof message === 'string' && message.length === 0)) {
    return null
  }

  const displayMessage = typeof message === 'string' ? message : 'Opération réussie'

  const handleDismiss = () => {
    if (onDismiss) onDismiss()
  }

  return (
    <div className="success-alert-container">
      <div className="success-alert">
        <div className="success-alert-header">
          <div className="success-alert-icon">
            <FiCheck />
          </div>
          <div className="success-alert-message">
            {displayMessage}
          </div>
          <button className="success-alert-close" onClick={handleDismiss} type="button">
            <FiX />
          </button>
        </div>
      </div>
    </div>
  )
}

export default SuccessAlert
