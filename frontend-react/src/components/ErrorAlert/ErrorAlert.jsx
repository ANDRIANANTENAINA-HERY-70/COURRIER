import React from 'react'
import { FiAlertCircle, FiX } from 'react-icons/fi'
import './ErrorAlert.css'

const ErrorAlert = ({ errors, onDismiss }) => {
  if (!errors || (Array.isArray(errors) && errors.length === 0) || (typeof errors === 'string' && !errors)) {
    return null
  }

  const errorList = Array.isArray(errors) ? errors : [errors]

  const handleDismiss = () => {
    if (onDismiss) onDismiss()
  }

  return (
    <div className="error-alert-container">
      <div className="error-alert">
        <div className="error-alert-header">
          <div className="error-alert-icon">
            <FiAlertCircle />
          </div>
          <div className="error-alert-title">
            {errorList.length === 1 ? 'Une erreur est survenue' : `${errorList.length} erreurs`}
          </div>
          <button className="error-alert-close" onClick={handleDismiss} type="button">
            <FiX />
          </button>
        </div>

        {errorList.length === 1 ? (
          <div className="error-alert-content">
            <p className="error-message-single">{errorList[0]}</p>
          </div>
        ) : (
          <ul className="error-list">
            {errorList.map((error, index) => (
              <li key={index} className="error-list-item">
                <span className="error-bullet">•</span>
                <span className="error-text">{error}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default ErrorAlert
