import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

// Ajoute automatiquement le token si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = (email, password) => api.post('/login', { email, password })
export const registerRequest = (data) => api.post('/register-request', data)
export const fetchPendingRequests = () => api.get('/register-requests')
export const approveRequest = (id) => api.post(`/register-requests/${id}/approve`)
export const rejectRequest = (id) => api.post(`/register-requests/${id}/reject`)

// Messages privés
export const sendMessage = (data) => api.post('/messages', data)
export const fetchInbox = () => api.get('/messages/received')
export const fetchSent = () => api.get('/messages/sent')
export const markMessageRead = (id) => api.put(`/messages/${id}/read`)

// Courriers sécurisés (user_id) via Sanctum
export const sendCourrier = (data) => api.post('/courriers', data) // data: { objet, message, receiver_id }
export const fetchCourrierInbox = () => api.get('/courriers/inbox')
export const fetchCourrierSent = () => api.get('/courriers/sent')

// Utilisateurs (pour choisir un destinataire)
export const fetchUsers = () => api.get('/users')

export default api
