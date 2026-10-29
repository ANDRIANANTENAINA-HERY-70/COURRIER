import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FiCamera, FiSave, FiUser, FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  fetchCurrentUser,
  updateUserProfile,
  uploadUserAvatar,
} from '../services/api'
import { resolveAvatarSrc } from '../utils/avatar'
import { syncStoredUserProfile } from '../utils/profileSync'
import './Profil.css'

const Profil = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [matricule, setMatricule] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [avatarFailed, setAvatarFailed] = useState(false)
  const inputRef = useRef(null)
  const messageTimerRef = useRef(null)

  const showMessage = (type, text, duration = 3000) => {
    setMessage({ type, text })
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current)

    if (duration > 0) {
      messageTimerRef.current = setTimeout(() => setMessage({ type: '', text: '' }), duration)
    }
  }

  const hydrateProfile = (profile, { updateAvatar = true } = {}) => {
    if (!profile) return

    setUser(profile)
    setName(profile.name || '')
    setEmail(profile.email || '')
    setMatricule(profile.matricule || '')
    if (updateAvatar) {
      setAvatar(resolveAvatarSrc(profile))
      setAvatarFailed(false)
    }
    syncStoredUserProfile(profile)
    window.dispatchEvent(new Event('profile-updated'))
  }

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const { data } = await fetchCurrentUser()
      if (import.meta.env.DEV) {
        console.debug('[profile] api user payload', {
          userId: data.user?.id,
          email: data.user?.email,
          photo_url: data.user?.photo_url,
          photo: data.user?.photo,
        })
      }
      if (data.success && data.user) {
        hydrateProfile(data.user)
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
      showMessage('error', 'Erreur lors du chargement du profil')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current)
    }
  }, [])

  const handleFile = async (file) => {
    if (!file) return

    try {
      setSaving(true)

      const { data } = await uploadUserAvatar(file)
      if (!data.success || !data.user) {
        showMessage('error', data.message || "Erreur lors de l'envoi de l'avatar")
        return
      }

      const refreshed = await fetchCurrentUser()
      if (refreshed.data.success && refreshed.data.user) {
        hydrateProfile(refreshed.data.user)
      } else {
        hydrateProfile(data.user)
      }

      showMessage('success', 'Avatar enregistré avec succès')
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.avatar?.[0] ||
        error.response?.data?.errors?.file?.[0] ||
        "Erreur lors de l'envoi de l'avatar"
      showMessage('error', backendMessage)
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    const trimmed = name.trim()
    const trimmedEmail = email.trim()
    const trimmedMatricule = matricule.trim()
    if (!trimmed) {
      showMessage('error', 'Le nom ne peut pas être vide')
      return
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showMessage('error', 'Veuillez saisir une adresse email valide')
      return
    }

    if (trimmedMatricule && !/^[0-9]{6}$/.test(trimmedMatricule)) {
      showMessage('error', 'Le matricule doit contenir exactement 6 chiffres')
      return
    }

    try {
      setSaving(true)

      const profilePayload = {}
      if (trimmed !== (user?.name || '').trim()) profilePayload.name = trimmed
      if (trimmedEmail !== (user?.email || '').trim()) profilePayload.email = trimmedEmail || null
      if (trimmedMatricule !== (user?.matricule || '').trim()) profilePayload.matricule = trimmedMatricule || null

      if (Object.keys(profilePayload).length > 0) {
        const { data } = await updateUserProfile(profilePayload)
        if (!data.success || !data.user) {
          showMessage('error', data.message || 'Erreur lors de la mise à jour du profil')
          return
        }

        hydrateProfile(data.user)
        showMessage('success', 'Profil enregistré avec succès')
      } else {
        showMessage('info', 'Aucune modification à enregistrer')
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error)
      showMessage('error', 'Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const closeProfile = () => {
    navigate(-1)
  }

  const content = (
    <motion.div
      className="profil-window modern-card"
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.98 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="profil-topbar">
        <button type="button" className="profil-close-btn" onClick={closeProfile} aria-label="Fermer">
          <FiX />
        </button>
      </div>

      {message.text && (
        <div className={`message-notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profil-main">
        <div className="profil-header">
          <div className="avatar-large">
            {avatar && !avatarFailed ? (
              <img
                src={avatar}
                alt="Avatar"
                onLoad={() => setAvatarFailed(false)}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="avatar-initials">
                <FiUser />
              </span>
            )}
          </div>
        </div>

        <div className="profil-actions">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              handleFile(file)
            }}
            disabled={saving}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
          >
            <FiCamera />
            {saving ? 'Chargement...' : 'Changer l’avatar'}
          </button>
        </div>

        <div className="profil-name">
          <label htmlFor="profile-name">Nom affiché</label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
            disabled={saving}
          />
        </div>

        <div className="profil-name">
          <label htmlFor="profile-email">Email</label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            disabled={saving}
          />
        </div>

        <div className="profil-matricule">
          <label htmlFor="profile-matricule">Numéro matricule</label>
          <input
            id="profile-matricule"
            type="text"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            placeholder="6 chiffres"
            maxLength={6}
            inputMode="numeric"
            disabled={saving}
          />
        </div>

        <div className="profil-save">
          <button
            type="button"
            className="btn btn-primary save-profile-btn"
            onClick={saveProfile}
            disabled={saving}
          >
            <FiSave />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="profil-page profil-page-modal">
        {content}
      </div>
    )
  }

  return (
    <div className="profil-page profil-page-modal" onMouseDown={(e) => {
      if (e.target === e.currentTarget) closeProfile()
    }}>
      {content}
    </div>
  )
}

export default Profil
