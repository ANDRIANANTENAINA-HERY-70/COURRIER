import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './LoginComplete.css'

function LoginComplete() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTime, setLockTime] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard')
    }
  }, [navigate])

  useEffect(() => {
    if (isLocked && lockTime > 0) {
      const timer = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false)
            setLoginAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isLocked, lockTime])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs')
      return false
    }
    
    // Accept both regular emails and simple usernames (for demo accounts)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const simpleUsernameRegex = /^[a-zA-Z0-9.-]+$/
    if (!emailRegex.test(formData.email) && !simpleUsernameRegex.test(formData.email)) {
      setError('Veuillez entrer une adresse email valide ou un nom d\'utilisateur')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (isLocked) {
      setError(`Compte temporairement bloqué. Réessayez dans ${lockTime} secondes`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login', formData)
      
      // Stocker le token et les infos utilisateur
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      window.dispatchEvent(new Event('auth-changed'))
      
      if (formData.remember) {
        localStorage.setItem('rememberedEmail', formData.email)
      }
      
      // Redirection vers le tableau de bord
      navigate('/dashboard')
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erreur de connexion'
      setError(errorMessage)
      
      // Gérer les tentatives de connexion
      const newAttempts = loginAttempts + 1
      setLoginAttempts(newAttempts)
      
      if (newAttempts >= 3) {
        setIsLocked(true)
        setLockTime(300) // 5 minutes de blocage
        setError('Trop de tentatives de connexion. Compte bloqué pendant 5 minutes.')
      }
      
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (email, password) => {
    setFormData({ email, password, remember: false })
  }

  const formatLockTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="logo-section">
          <div className="logo-container">
            <span className="logo-text">CF</span>
          </div>
          <h2 className="app-title">
            CareerFlow
          </h2>
          <p className="app-subtitle">
            Gestion intelligente des absences et de l'assiduité
          </p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="error-message">
                <div className="error-content">
                  <svg className="error-icon w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <div className="error-text">{error}</div>
                    {isLocked && (
                      <div className="lock-timer">
                        Temps restant: {formatLockTime(lockTime)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Adresse email
              </label>
              <div className="input-container">
                <svg className="input-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={isLocked}
                  className="form-input"
                  placeholder="nom.utilisateur ou email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Mot de passe
              </label>
              <div className="input-container">
                <svg className="input-icon w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLocked}
                  className="form-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="form-options">
              <div className="checkbox-container">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  disabled={isLocked}
                  className="checkbox-input"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label htmlFor="remember" className="checkbox-label">
                  Se souvenir de moi
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="forgot-password"
              >
                Mot de passe oublié?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isLocked}
              className="submit-button"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="loading-spinner"></div>
                  Connexion en cours...
                </span>
              ) : isLocked ? (
                `Compte bloqué (${formatLockTime(lockTime)})`
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

        {/* Demo Accounts */}
        <div className="demo-section">
          <div className="demo-title">Comptes de démonstration:</div>
          <div className="demo-accounts">
            <button
              onClick={() => handleQuickLogin('sophie.martin', 'password123')}
              className="demo-button"
              disabled={isLocked}
            >
              <div className="demo-label">Manager:</div>
              <div className="demo-credentials">sophie.martin</div>
            </button>
            <button
              onClick={() => handleQuickLogin('lucas.dubois', 'password123')}
              className="demo-button"
              disabled={isLocked}
            >
              <div className="demo-label">Employé:</div>
              <div className="demo-credentials">lucas.dubois</div>
            </button>
          </div>
        </div>

        {/* Register Link */}
        <div className="register-section">
          <p className="register-text">
            Pas encore de compte?{' '}
            <Link
              to="/register"
              className="register-link"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        {/* Security Info */}
        <div className="security-info">
          <p className="security-text">Connexion sécurisée</p>
          <p className="security-text">Protection des données</p>
          <p className="security-text">RGPD conforme</p>
        </div>
      </div>
    </div>
  )
}

export default LoginComplete
