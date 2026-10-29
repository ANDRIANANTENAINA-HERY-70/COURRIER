/**
 * Parse and normalize error information from various sources
 */
export const parseErrorMessage = (error) => {
  if (!error) return []

  // If it's already an array, clean and filter it
  if (Array.isArray(error)) {
    return error
      .filter(e => e && typeof e === 'string')
      .map(e => e.trim())
      .filter(e => e.length > 0)
  }

  // If it's a string
  if (typeof error === 'string') {
    return [error.trim()].filter(e => e.length > 0)
  }

  // Handle axios error object
  if (error.response?.data) {
    const data = error.response.data

    // Handle Laravel validation errors (object with field: [errors])
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const errors = []
      for (const [field, fieldErrors] of Object.entries(data.errors)) {
        if (Array.isArray(fieldErrors)) {
          errors.push(...fieldErrors)
        } else if (typeof fieldErrors === 'string') {
          errors.push(fieldErrors)
        }
      }
      if (errors.length > 0) return errors
    }

    // Handle errors array
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors
        .filter(e => e && (typeof e === 'string' || e.message))
        .map(e => (typeof e === 'string' ? e : e.message))
    }

    // Handle single message
    if (data.message && typeof data.message === 'string') {
      return [data.message]
    }
  }

  // Handle generic error object
  if (error.message && typeof error.message === 'string') {
    return [error.message]
  }

  return ['Une erreur est survenue']
}

/**
 * Create array of user-friendly error messages
 */
export const createErrorList = (errors) => {
  return parseErrorMessage(errors).map((msg, idx) => {
    // Only capitalize first letter, don't mess with content
    if (msg.length === 0) return msg
    return msg.charAt(0).toUpperCase() + msg.slice(1)
  })
}
