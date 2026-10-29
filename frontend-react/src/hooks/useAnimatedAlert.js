import { useState } from 'react'

const useAnimatedAlert = () => {
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'error',
    duration: 5000
  })

  const showAlert = (message, type = 'error', duration = 5000) => {
    setAlert({
      show: true,
      message,
      type,
      duration
    })
  }

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, show: false }))
  }

  const showError = (message, duration = 5000) => {
    showAlert(message, 'error', duration)
  }

  const showSuccess = (message, duration = 5000) => {
    showAlert(message, 'success', duration)
  }

  const showWarning = (message, duration = 5000) => {
    showAlert(message, 'warning', duration)
  }

  const showInfo = (message, duration = 5000) => {
    showAlert(message, 'info', duration)
  }

  return {
    alert,
    showAlert,
    hideAlert,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}

export default useAnimatedAlert
