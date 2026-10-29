import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiArrowRight, FiCheckCircle, FiAlertCircle, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi'
import { forgotPassword, verifyResetCode, resetPassword } from '../services/api'
import './ForgotPasswordCode.css'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // État pour le mode "J'ai un code"
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [code, setCode] = useState('')
  const [codeVerified, setCodeVerified] = useState(false)
  
  // État pour le nouveau mot de passe
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    password_confirmation: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  // Gestion de la demande de code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      await forgotPassword(identifier)
      setMessage('Votre demande a été envoyée aux administrateurs. Un code de réinitialisation a été généré et envoyé à l\'équipe administrative.')
      // Rediriger vers la page de vérification du code après un court délai
      setTimeout(() => {
        navigate(`/forgot-password-code?email=${encodeURIComponent(identifier)}`)
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de l\'envoi du lien. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  // Gestion de la vérification du code
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPasswordError('')
    setPasswordSuccess('')

    try {
      await verifyResetCode({ email: identifier, code })
      setCodeVerified(true)
      setMessage('Code validé avec succès. Vous pouvez maintenant définir un nouveau mot de passe.')
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  // Gestion de la réinitialisation du mot de passe
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      setPasswordLoading(false)
      return
    }

    if (passwordForm.password.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.')
      setPasswordLoading(false)
      return
    }

    try {
      await resetPassword({
        email: identifier,
        code,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation
      })
      setPasswordSuccess('Mot de passe réinitialisé avec succès. Redirection vers la connexion...')
      setTimeout(() => {
        navigate('/login')
      }, 2500)
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Basculer vers le formulaire de code
  const toggleToCodeForm = () => {
    setShowCodeForm(true)
    setError('')
    setMessage('')
  }

  // Retour au formulaire principal
  const backToMainForm = () => {
    setShowCodeForm(false)
    setCodeVerified(false)
    setCode('')
    setPasswordForm({ password: '', password_confirmation: '' })
    setPasswordError('')
    setPasswordSuccess('')
    setError('')
    setMessage('')
  }

  return (
    <div className="code-page">
      <div className="code-card">
        {/* En-tête */}
        <div className="code-header">
          <FiMail className="code-icon" />
          <h1>Mot de passe oublié</h1>
          <p>
            {!showCodeForm 
              ? "Entrez votre email pour demander un code de réinitialisation."
              : !codeVerified 
                ? "Entrez le code de réinitialisation que vous avez reçu."
                : "Définissez votre nouveau mot de passe."
            }
          </p>
        </div>

        {/* Messages globaux */}
        {message && (
          <div className="code-success">
            <FiCheckCircle />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="code-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire principal - Demande de code */}
        {!showCodeForm && (
          <>
            <form className="code-form" onSubmit={handleRequestCode}>
              <label htmlFor="identifier">
                <FiMail />
                Email ou Matricule
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="off"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="votre@email.com ou votre matricule"
              />

              <button type="submit" className="code-button" disabled={loading}>
                {loading ? (
                  <>
                    <span>Envoi...</span>
                  </>
                ) : (
                  <>
                    <span>Demander le code</span>
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            {/* Bouton "J'ai un code" */}
            <div className="code-divider">
              <span>ou</span>
            </div>

            <button 
              className="code-button code-button-secondary"
              onClick={toggleToCodeForm}
            >
              <FiKey />
              <span>J'ai déjà un code</span>
            </button>
          </>
        )}

        {/* Formulaire de vérification du code */}
        {showCodeForm && !codeVerified && (
          <>
            <form className="code-form" onSubmit={handleVerifyCode}>
              <label htmlFor="email-verify">
                <FiMail />
                Email ou Matricule
              </label>
              <input
                id="email-verify"
                type="text"
                autoComplete="off"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="votre@email.com ou votre matricule"
              />

              <label htmlFor="code">
                <FiKey />
                Code de réinitialisation
              </label>
              <input
                id="code"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="code-input"
              />

              <button type="submit" className="code-button" disabled={loading || code.length !== 6}>
                {loading ? 'Vérification...' : 'Vérifier le code'}
              </button>
            </form>

            <button 
              className="code-button code-button-back"
              onClick={backToMainForm}
            >
              <span>Retour</span>
            </button>
          </>
        )}

        {/* Formulaire de nouveau mot de passe */}
        {showCodeForm && codeVerified && (
          <>
            {passwordSuccess && (
              <div className="code-success">
                <FiCheckCircle />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="code-error">
                <FiAlertCircle />
                <span>{passwordError}</span>
              </div>
            )}

            <form className="code-form" onSubmit={handleResetPassword}>
              <label>
                <FiMail />
                Email ou Matricule
              </label>
              <input
                type="text"
                value={identifier}
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
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
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
                  value={passwordForm.password_confirmation}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
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

              <button 
                type="submit" 
                className="code-button" 
                disabled={passwordLoading || passwordForm.password.length < 8}
              >
                {passwordLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </button>
            </form>

            <button 
              className="code-button code-button-back"
              onClick={backToMainForm}
            >
              <span>Retour</span>
            </button>
          </>
        )}

        {/* Pied de page */}
        <div className="code-footer">
          <Link to="/login">Retour au login</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword