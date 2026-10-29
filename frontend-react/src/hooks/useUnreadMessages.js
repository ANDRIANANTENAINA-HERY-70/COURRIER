import { useState, useEffect, useCallback } from 'react'
import { fetchCourrierInbox, fetchInbox, markMessageRead } from '../services/api'

/**
 * Hook pour gérer les notifications des courriers entrants non-lus
 */
export const useUnreadMessages = () => {
  const [unreadMessages, setUnreadMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const normalizeId = useCallback((value) => String(value), [])

  const getCurrentUser = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }, [])

  const getReadStorageKey = useCallback(() => {
    const user = getCurrentUser()
    const userSuffix = user?.id || user?.email || 'anonymous'
    return `readMessages:${userSuffix}`
  }, [getCurrentUser])

  // Récupérer les IDs des courriers lus depuis localStorage
  const getReadMessageIds = useCallback(() => {
    const storageKey = getReadStorageKey()
    const stored = localStorage.getItem(storageKey) || localStorage.getItem('readMessages')
    if (!stored) return new Set()

    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? new Set(parsed.map(normalizeId)) : new Set()
    } catch {
      // Si le cache local est corrompu, on le réinitialise proprement.
      localStorage.removeItem('readMessages')
      return new Set()
    }
  }, [getReadStorageKey, normalizeId])

  const saveReadMessageIds = useCallback((readIds) => {
    const storageKey = getReadStorageKey()
    const payload = JSON.stringify(Array.from(readIds).map(normalizeId))
    localStorage.setItem(storageKey, payload)
    // Migration silencieuse pour les anciens écrans qui lisaient la clé globale.
    localStorage.setItem('readMessages', payload)
  }, [getReadStorageKey, normalizeId])

  const normalizeCourrier = useCallback((courrier) => ({
    id: `courrier-${courrier.id}`,
    source: 'courrier',
    sourceId: courrier.id,
    objet: courrier.objet || courrier.subject || 'Sans objet',
    message: courrier.message || courrier.content || '',
    sender: courrier.sender,
    created_at: courrier.created_at || courrier.dateReception || courrier.date_reception,
    raw: courrier,
  }), [])

  const normalizePrivateMessage = useCallback((message) => ({
    id: `message-${message.id}`,
    source: 'message',
    sourceId: message.id,
    objet: message.subject || 'Sans objet',
    message: message.content || '',
    sender: message.sender,
    created_at: message.created_at,
    is_read: Boolean(message.is_read),
    raw: message,
  }), [])

  const resolveNotification = useCallback((notificationOrId) => {
    if (!notificationOrId) return null

    if (typeof notificationOrId === 'object') {
      return notificationOrId
    }

    return unreadMessages.find((item) => {
      return String(item.id) === String(notificationOrId) || String(item.sourceId) === String(notificationOrId)
    }) || null
  }, [unreadMessages])

  // Marquer un courrier comme lu
  const markMessageAsRead = useCallback((messageId) => {
    const readIds = getReadMessageIds()
    readIds.add(messageId)
    saveReadMessageIds(readIds)
  }, [getReadMessageIds, saveReadMessageIds])

  // Récupérer les courriers non-lus
  const fetchUnread = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [courriersResult, messagesResult] = await Promise.allSettled([
        fetchCourrierInbox(),
        fetchInbox(),
      ])

      const readIds = getReadMessageIds()

      const courriers = courriersResult.status === 'fulfilled'
        ? (courriersResult.value.data.data || courriersResult.value.data || [])
        : []

      const messages = messagesResult.status === 'fulfilled'
        ? (messagesResult.value.data.data || messagesResult.value.data || [])
        : []

      const unreadCourriers = courriers
        .filter(courrier => courrier.statut !== 'archive' && !readIds.has(normalizeId(courrier.id)))
        .map(normalizeCourrier)

      const unreadPrivateMessages = messages
        .filter(message => !message.is_read)
        .map(normalizePrivateMessage)

      const unread = [...unreadPrivateMessages, ...unreadCourriers]
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))

      setUnreadMessages(unread)
      return unread
    } catch (err) {
      console.error('Erreur lors de la récupération des non-lus:', err)
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [getReadMessageIds, normalizeCourrier, normalizeId, normalizePrivateMessage])

  // Auto-refresh des messages non-lus
  useEffect(() => {
    // Seulement rafraîchir au chargement initial
    fetchUnread()
    
    // Vérifier qu'au retour de la page (visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnread()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Écouter les événements de rafraîchissement
    const handleRefreshEvent = () => {
      fetchUnread()
    }
    window.addEventListener('refreshUnreadMessages', handleRefreshEvent)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('refreshUnreadMessages', handleRefreshEvent)
    }
  }, [fetchUnread])

  const markAsRead = useCallback(async (notificationOrId) => {
    const notification = resolveNotification(notificationOrId)
    const fallbackId = typeof notificationOrId === 'object' ? notificationOrId?.sourceId : notificationOrId

    if (notification?.source === 'message') {
      try {
        await markMessageRead(notification.sourceId)
      } catch (err) {
        console.error('Erreur lors du marquage du message comme lu:', err)
      }
    } else if (fallbackId) {
      markMessageAsRead(fallbackId)
    }

    const targetIds = new Set([
      notification?.id != null ? normalizeId(notification.id) : null,
      notification?.sourceId != null ? normalizeId(notification.sourceId) : null,
      fallbackId != null ? normalizeId(fallbackId) : null,
    ].filter(Boolean))

    setUnreadMessages(prev =>
      prev.filter(msg => !targetIds.has(normalizeId(msg.id)) && !targetIds.has(normalizeId(msg.sourceId)))
    )
  }, [markMessageAsRead, normalizeId, resolveNotification])

  const clearAll = useCallback(() => {
    // Marquer tous les messages actuels comme lus
    unreadMessages.forEach(msg => {
      if (msg.source === 'message') {
        markAsRead(msg)
      } else {
        markMessageAsRead(msg.sourceId || msg.id)
      }
    })
    setUnreadMessages([])
  }, [unreadMessages, markAsRead, markMessageAsRead])

  return {
    unreadMessages,
    loading,
    error,
    refreshUnread: fetchUnread,
    markAsRead,
    clearAll,
    count: unreadMessages.length,
    markMessageAsRead
  }
}
