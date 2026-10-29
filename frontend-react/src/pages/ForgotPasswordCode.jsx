import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FiShield, FiKey, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { verifyResetCode } from '../services/api'
import './ForgotPasswordCode.css'

const ForgotPasswordCode = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await verifyResetCode({ email, code })
      setSuccess('Code validé. Vous allez être redirigé vers la page du nouveau mot de passe.')
      setTimeout(() => {
        navigate(`/reset-password/new?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`)
      }, 900)
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="code-page">
      <div className="code-card">
        <div className="code-header">
          <FiShield className="code-icon" />
          <h1>Code de réinitialisation</h1>
          <p>Entrez le code transmis par un administrateur pour continuer.</p>
        </div>

        <div className="code-info">
          {email ? (
            <span>Identifiant concerné: <strong>{email}</strong></span>
          ) : (
            <span>Aucun identifiant trouvé. Retournez au login pour recommencer.</span>
          )}
        </div>

        {error && (
          <div className="code-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="code-success">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <form className="code-form" onSubmit={handleSubmit}>
          <label htmlFor="reset-code">
            <FiKey />
            Code texto
          </label>
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            placeholder="Ex: 123456"
            required
          />

          <button type="submit" className="code-button" disabled={loading || !email}>
            {loading ? 'Vérification...' : 'Vérifier le code'}
          </button>
        </form>

        <div className="code-footer">
          <Link to="/login">Retour au login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordCode
