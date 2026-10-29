import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FiMail, FiLock, FiLogIn, FiUserPlus, FiShield } from 'react-icons/fi'
import { login as apiLogin, registerDirect, fetchPendingRequests, approveRequest, rejectRequest, checkName } from '../services/api'
import './Login.css'

const getRedirectPath = () => '/dashboard'

const Login = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSignup, setShowSignup] = useState(false)
  const roleOptions = [

    { value: 'dg', label: '🏢 Direction Générale (DG)' },
    { value: 'sg', label: '📑 Secrétariat Général (SG)' },
    { value: 'service_courrier', label: '📬 Service de courrier (Lecture / Dispatching)' },
    { value: 'rh', label: '👨‍💼 Ressources Humaines (RH)' },
    { value: 'drh', label: '🧑‍💼 Direction des Ressources Humaines (DRH)' },
    { value: 'compta', label: '💰 Comptabilité / Finance' },
    { value: 'technique', label: '📊 Service technique / opérationnel' },
    { value: 'circuit', label: '🔄 Circuit typique d’un courrier' },
    { value: 'autre', label: '❓ Autre' }
  ]

  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    matricule: '',
    password: '',
    role: roleOptions[0].value
  })
  const [signupMessage, setSignupMessage] = useState('')
  const [nameError, setNameError] = useState('')
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [adminAuth, setAdminAuth] = useState({ email: '', password: '' })
  const [adminError, setAdminError] = useState('')
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        JSON.parse(storedUser)
        navigate(getRedirectPath(), { replace: true })
      } catch {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [navigate])

  useEffect(() => {
    if (adminAuthenticated) {
      loadPending()
    }
  }, [adminAuthenticated])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    apiLogin(formData.email, formData.password)
      .then(({ data }) => {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('auth-changed'))
        navigate(getRedirectPath())
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Email ou mot de passe incorrect'
        setError(msg)
      })
      .finally(() => setIsLoading(false))
  }

  const checkNameUnique = async (name) => {
    if (!name) return true
    try {
      const response = await checkName(name)
      return response.data.available
    } catch (err) {
      return false
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setSignupMessage('')
    setNameError('')
    if (!signupForm.name || !signupForm.password || !signupForm.matricule) {
      setSignupMessage('Le nom, le mot de passe et le matricule sont obligatoires')
      return
    }
    if (signupForm.matricule.length !== 6) {
      setSignupMessage('Le numéro matricule doit contenir exactement 6 chiffres')
      return
    }

    // Check name uniqueness
    const isNameUnique = await checkNameUnique(signupForm.name)
    if (!isNameUnique) {
      setNameError('Ce nom est déjà utilisé. Veuillez ajouter un nom différent.')
      return
    }

    const payload = { ...signupForm }
    registerDirect(payload)
      .then(({ data }) => {
        // Connexion immédiate
        if (data.token && data.user) {
          localStorage.setItem('token', data.token)
          localStorage.setItem('user', JSON.stringify(data.user))
          window.dispatchEvent(new Event('auth-changed'))
          navigate(getRedirectPath())
          return
        }
        setSignupMessage(data.message || 'Compte créé')
        setSignupForm({ name: '', email: '', matricule: '', password: '', role: 'agent' })
      })
      .catch((err) => {
        const status = err.response?.status
        const msg = err.response?.data?.message
        if (status === 422) {
          setSignupMessage(msg || 'Email déjà utilisé.')
        } else {
          setSignupMessage(msg || 'Erreur lors de la création du compte')
        }
      })
  }

  const handleAdminLogin = (e) => {
    e.preventDefault()
    setAdminError('')
    apiLogin(adminAuth.email, adminAuth.password)
      .then(({ data }) => {
        if (data.user?.role !== 'admin') {
          setAdminError('Accès réservé aux administrateurs')
          return
        }
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('auth-changed'))
        setAdminAuthenticated(true)
        loadPending()
      })
      .catch(() => setAdminError('Identifiants admin invalides'))
  }

  const loadPending = () => {
    fetchPendingRequests()
      .then(({ data }) => setPendingRequests(data.data || []))
      .catch(() => setPendingRequests([]))
  }

  const approveUser = (id) => {
    approveRequest(id)
      .then(() => loadPending())
      .catch(() => alert("Erreur lors de la validation"))
  }

  const rejectUser = (id) => {
    rejectRequest(id)
      .then(() => loadPending())
      .catch(() => alert("Erreur lors du refus"))
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-logo-box">
          <img src="/images/logo" alt="Logo" className="login-logo" />
        </div>
        <div className="login-card">
          <div className="login-header">
            <h1>Gestion Courrier</h1>
            <p>Connectez-vous à votre espace</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <FiMail className="input-icon" />
                Email ou Matricule
              </label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemple@domain.com ou votre matricule"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FiLock className="input-icon" />
                Mot de passe
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <div className="forgot-password-link">
                <Link to="/forgot-password">Mot de passe oublié ?</Link>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Connexion...</span>
              ) : (
                <>
                  <FiLogIn />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <button
            className="link-button"
            onClick={() => setShowSignup(true)}
          >
            <FiUserPlus /> Créer un compte
          </button>

          

          

          {adminPanelOpen && (
            <div className="admin-panel">
              {!adminAuthenticated ? (
                <form onSubmit={handleAdminLogin} className="admin-auth-form">
                  <div className="form-group">
                    <label>Email admin</label>
                    <input
                      type="email"
                      value={adminAuth.email}
                      onChange={(e) => setAdminAuth({ ...adminAuth, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mot de passe</label>
                    <input
                      type="password"
                      value={adminAuth.password}
                      onChange={(e) => setAdminAuth({ ...adminAuth, password: e.target.value })}
                      required
                    />
                  </div>
                  <button type="submit" className="login-button">
                    <FiShield /> Ouvrir la validation
                  </button>
                  {adminError && <p className="error-message">{adminError}</p>}
                </form>
              ) : (
                <div className="pending-list">
                  <h3>Comptes en attente</h3>
                  {pendingRequests.length === 0 && <p>Aucune demande en attente.</p>}
                  {pendingRequests.map(u => (
                    <div key={u.id} className="pending-item">
                      <div>
                        <strong>{u.name}</strong> ({u.email}) — rôle demandé : {u.role}
                      </div>
                      <div className="pending-actions">
                        <button className="btn-approve" type="button" onClick={() => approveUser(u.id)}>Accepter</button>
                        <button className="btn-reject" type="button" onClick={() => rejectUser(u.id)}>Refuser</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showSignup && (
        <div className="signup-modal-backdrop" onClick={() => setShowSignup(false)}>
          <div className="signup-modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>Créer un compte</h2>
              <button className="signup-close" onClick={() => setShowSignup(false)}>×</button>
            </header>
            <form onSubmit={handleSignup} className="signup-form">
              {nameError && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                  {nameError}
                </div>
              )}
              <div className="form-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => {
                    const lettersOnlyValue = e.target.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '')
                    setSignupForm({ ...signupForm, name: lettersOnlyValue })
                    setNameError('')
                  }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email (optionnel)</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Numéro Matricule (6 chiffres)</label>
                <input
                  type="text"
                  value={signupForm.matricule}
                  onChange={(e) => setSignupForm({ ...signupForm, matricule: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="Ex: 123456"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                />
                <small className="hint">Entrez exactement 6 chiffres</small>
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  required
                />
              </div>
            <div className="form-group">
              <label>Rôle souhaité</label>
              <select
                value={signupForm.role}
                onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
              <button type="submit" className="login-button">
                <FiUserPlus /> Envoyer la demande
              </button>
              {signupMessage && <p className="info-message">{signupMessage}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
