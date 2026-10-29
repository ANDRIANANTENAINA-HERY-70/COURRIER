import React, { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { FiLock, FiMail, FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { resetPassword } from '../services/api'
import './ResetPassword.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const code = searchParams.get('code') || ''

  const [form, setForm] = useState({
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await resetPassword({
        email,
        code,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })

      setSuccess('Mot de passe réinitialisé avec succès. Redirection vers la connexion...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-page">
      <div className="reset-card">
        <div className="reset-header">
          <FiLock className="reset-icon" />
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>
        </div>

        <div className="reset-info">
          {email ? (
            <span>Email concerné: <strong>{email}</strong></span>
          ) : (
            <span>Email manquant. Retournez en arrière pour recommencer le processus.</span>
          )}
        </div>

        {error && (
          <div className="reset-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="reset-success">
            <FiCheckCircle />
            <span>{success}</span>
          </div>
        )}

        <form className="reset-form" onSubmit={handleSubmit}>
          <label>
            <FiMail />
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            readOnly
          />

          <label>
            <FiLock />
            Nouveau mot de passe
          </label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="Nouveau mot de passe"
              minLength={8}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <label>
            <FiLock />
            Confirmer le mot de passe
          </label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required
              placeholder="Confirmez le mot de passe"
              minLength={8}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button type="submit" className="reset-button" disabled={loading || !email || !code}>
            {loading ? 'Réinitialisation...' : 'Modifier le mot de passe'}
          </button>
        </form>

        <div className="reset-footer">
          <Link to="/login">Retour au login</Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
