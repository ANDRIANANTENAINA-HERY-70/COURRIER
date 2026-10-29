import React, { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import IncomingMessageToast from '../IncomingMessageToast/IncomingMessageToast'
import './NotificationCenter.css'

const NotificationCenter = ({ unreadMessages = [] }) => {
  const [toasts, setToasts] = useState([])
  const shownMessagesRef = useRef(new Set())

  // Afficher un toast pour les nouveaux messages
  useEffect(() => {
    unreadMessages.forEach(message => {
      if (!shownMessagesRef.current.has(message.id)) {
        // Marquer comme affiché
        shownMessagesRef.current.add(message.id)
        
        // Ajouter le toast
        const toastId = `toast-${message.id}-${Date.now()}`
        setToasts(prev => [...prev, { id: toastId, message }])
        
        // Auto-remove après 8 secondes (si pas fermé)
        const timer = setTimeout(() => {
          removeToast(toastId)
        }, 8000)
        
        return () => clearTimeout(timer)
      }
    })
  }, [unreadMessages])

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId))
  }

  return (
    <div className="notification-center">
      <AnimatePresence>
        {toasts.map(({ id, message }) => (
          <IncomingMessageToast
            key={id}
            message={message}
            onDismiss={() => removeToast(id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationCenter
