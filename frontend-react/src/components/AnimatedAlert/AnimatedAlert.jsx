import React, { useEffect, useRef } from 'react'
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'
import './AnimatedAlert.css'

const AnimatedAlert = ({ 
  message, 
  type = 'error', 
  show = false, 
  duration = 5000, 
  onClose,
  position = 'top'
}) => {
  const timerRef = useRef(null)

  useEffect(() => {
    if (show && duration > 0) {
      timerRef.current = setTimeout(() => {
        if (onClose) onClose()
      }, duration)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [show, duration, onClose])

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (onClose) onClose()
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheckCircle />
      case 'error':
        return <FiAlertCircle />
      case 'warning':
        return <FiAlertCircle />
      default:
        return <FiAlertCircle />
    }
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`animated-alert ${type} position-${position}`}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="alert-content">
            <div className="alert-icon">
              {getIcon()}
            </div>
            <span className="alert-message">{message}</span>
            {onClose && (
              <button className="alert-close" onClick={handleClose}>
                <FiX />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnimatedAlert
