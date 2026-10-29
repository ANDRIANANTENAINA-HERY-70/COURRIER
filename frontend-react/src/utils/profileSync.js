import { getAvatarStorageKeys, resolveAvatarSrc } from './avatar'

const safeParseUser = (raw) => {
  try {
    return JSON.parse(raw || 'null')
  } catch {
    localStorage.removeItem('user')
    return null
  }
}

export const getStoredUser = () => safeParseUser(localStorage.getItem('user'))

export const dispatchProfileChangeEvents = () => {
  window.dispatchEvent(new Event('avatar-updated'))
  window.dispatchEvent(new Event('user-name-updated'))
  window.dispatchEvent(new Event('user-updated'))
  window.dispatchEvent(new Event('users-updated'))
}

export const clearProfileOverrides = (user = getStoredUser()) => {
  const { nameKey } = getAvatarStorageKeys(user)
  localStorage.removeItem('userProfileName')
  localStorage.removeItem(nameKey)
}

export const syncStoredUserProfile = (user) => {
  if (!user) return null

  const nextUser = {
    ...user,
    photo_url: resolveAvatarSrc(user) || user?.photo_url || '',
    photo: user?.photo || '',
  }

  localStorage.setItem('user', JSON.stringify(nextUser))
  clearProfileOverrides(user)
  dispatchProfileChangeEvents()

  return nextUser
}

export const persistProfileName = (name) => {
  const trimmed = String(name || '').trim()
  if (!trimmed) return false

  const user = getStoredUser()
  const { nameKey } = getAvatarStorageKeys(user)
  localStorage.setItem(nameKey, trimmed)
  localStorage.removeItem('userProfileName')

  if (user) {
    localStorage.setItem('user', JSON.stringify({ ...user, name: trimmed }))
  }

  dispatchProfileChangeEvents()
  return true
}
