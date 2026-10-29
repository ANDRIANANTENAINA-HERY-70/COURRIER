const DEFAULT_API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '')

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const hashCode = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const colorFromSeed = (seed) => {
  const hue = hashCode(seed) % 360
  return `hsl(${hue} 65% 45%)`
}

export const getInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
}

export const buildPhotoUrl = (photo, apiBaseUrl = '') => {
  if (!photo) return ''

  const raw = String(photo).trim()
  if (!raw) return ''
  if (/^(https?:\/\/|data:|blob:)/i.test(raw)) return raw

  const apiBase = String(apiBaseUrl || DEFAULT_API_ORIGIN || '').replace(/\/+$/, '')
  const normalized = raw
    .replace(/^public\//, '')
    .replace(/^\/+/, '')

  if (normalized.startsWith('storage/')) {
    return apiBase ? `${apiBase}/${normalized}` : `/${normalized}`
  }

  return apiBase ? `${apiBase}/storage/${normalized}` : `/storage/${normalized}`
}

export const resolveAvatarSrc = (user, apiBaseUrl = '') => {
  if (!user) return ''

  const direct = user.photo_url || user.avatar_url || user.photoUrl || ''
  if (direct) {
    const resolvedDirect = String(direct)
    if (!/^(https?:\/\/|data:|blob:)/i.test(resolvedDirect)) {
      const normalizedDirect = buildPhotoUrl(resolvedDirect, apiBaseUrl || DEFAULT_API_ORIGIN)
      if (import.meta.env.DEV) {
        console.debug('[avatar] source=normalized direct path', {
          userId: user.id,
          email: user.email,
          src: normalizedDirect,
        })
      }
      return normalizedDirect
    }
    if (import.meta.env.DEV) {
      console.debug('[avatar] source=direct photo_url', {
        userId: user.id,
        email: user.email,
        src: resolvedDirect,
      })
    }
    return resolvedDirect
  }

  const fallback = buildPhotoUrl(user.photo || user.avatar || '', apiBaseUrl || DEFAULT_API_ORIGIN)
  if (import.meta.env.DEV && fallback) {
    console.debug('[avatar] source=storage photo', {
      userId: user.id,
      email: user.email,
      src: fallback,
    })
  }
  return fallback
}

export const createAvatarDataUri = ({ name = '', email = '', size = 96 }) => {
  const seed = String(email || name || 'user')
  const initials = escapeXml(getInitials(name || email || 'U'))
  const bg = colorFromSeed(seed)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Avatar">
  <rect width="100%" height="100%" rx="${Math.round(size / 2)}" fill="${bg}" />
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.38)}" font-weight="700">${initials}</text>
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const getAvatarStorageKeys = (user) => {
  const id = user?.id ?? user?.email ?? 'default'
  return {
    nameKey: `userProfileName:${id}`,
  }
}
