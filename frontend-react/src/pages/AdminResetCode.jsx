import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiCopy, FiArrowLeft, FiKey, FiClock } from 'react-icons/fi'
import './AdminResetCode.css'

const AdminResetCode = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [copyMessage, setCopyMessage] = useState('')

  const email = searchParams.get('email') || ''
  const code = searchParams.get('code') || ''
  const name = searchParams.get('name') || 'Utilisateur'
  const expires = searchParams.get('expires') || ''

  const copyCode = async () => {
    if (!code) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
        setCopyMessage('Code copié')
        window.setTimeout(() => setCopyMessage(''), 2000)
      }
    } catch {
      setCopyMessage('Copie impossible')
    }
  }

  return (
    <div className="admin-reset-page">
      <div className="admin-reset-card">
        <div className="admin-reset-header">
          <FiKey className="admin-reset-icon" />
          <h1>Code de réinitialisation</h1>
          <p>Page admin pour consulter et copier le code à transmettre.</p>
        </div>

        <div className="admin-reset-info">
          <div><strong>Compte :</strong> {name}</div>
          <div><strong>Email :</strong> {email}</div>
          {expires && (
            <div className="admin-reset-expiry">
              <FiClock />
              <span>Expire le {new Date(expires).toLocaleString('fr-FR')}</span>
            </div>
          )}
        </div>

        <div className="admin-reset-code-box">
          <span>Code à communiquer</span>
          <strong>{code || 'Aucun code disponible'}</strong>
        </div>

        <div className="admin-reset-actions">
          <button type="button" className="admin-reset-copy" onClick={copyCode} disabled={!code}>
            <FiCopy />
            Copier le code
          </button>
          <button type="button" className="admin-reset-back" onClick={() => navigate('/utilisateurs')}>
            <FiArrowLeft />
            Retour
          </button>
        </div>

        {copyMessage && <p className="admin-reset-copy-message">{copyMessage}</p>}

        <Link className="admin-reset-link" to={`/reset-password/new?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`}>
          Ouvrir la page de changement de mot de passe
        </Link>
      </div>
    </div>
  )
}

export default AdminResetCode
