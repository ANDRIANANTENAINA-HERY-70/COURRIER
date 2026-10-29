import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData
    if (isFormData) {
      if (typeof config.headers?.delete === 'function') {
        config.headers.delete('Content-Type')
      } else {
        delete config.headers['Content-Type']
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('token');
      // En mode démo (token fictif), on ne force pas la déconnexion
      if (token !== 'demo-token') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Helpers API
export const login = (email, password) => api.post('/login', { email, password });
export const registerRequest = (data) => api.post('/register-request', data);
export const registerDirect = (data) => api.post('/signup', data);
export const fetchPendingRequests = () => api.get('/register-requests');
export const approveRequest = (id) => api.post(`/register-requests/${id}/approve`);
export const rejectRequest = (id) => api.post(`/register-requests/${id}/reject`);
export const checkName = (name) => api.get('/check-name', { params: { name } });

// Messages privés
export const sendMessage = (data) => api.post('/messages', data);
export const fetchInbox = () => api.get('/messages/received');
export const fetchSent = () => api.get('/messages/sent');
export const markMessageRead = (id) => api.put(`/messages/${id}/read`);

// Utilisateurs (destinataires)
export const fetchUsers = () => api.get('/users');
export const fetchUserSettings = () => api.get('/user/settings');
export const updateUserSettings = (settings) => api.put('/user/settings', settings);
export const fetchCurrentUser = () => api.get('/user');
export const updateUserProfile = (data) => api.put('/user/profile', data);
export const uploadUserAvatar = (avatar) => {
  const formData = new FormData();
  formData.append('avatar', avatar);
  return api.post('/user/avatar', formData);
};
export const deleteUserAvatar = () => api.delete('/user/avatar');

// Courriers sécurisés (user_id)
export const sendCourrier = (data) => api.post('/courriers', data); // { objet, message, receiver_id }
export const fetchCourrierInbox = () => api.get('/courriers/inbox');
export const fetchCourrierSent = () => api.get('/courriers/sent');
export const sendCourrierWithFile = ({ objet, message, receiver_id, fichiers }) => {
  const formData = new FormData();
  formData.append('objet', objet);
  formData.append('message', message);
  formData.append('receiver_id', receiver_id);
  // Support both single file and multiple files
  if (fichiers) {
    if (Array.isArray(fichiers)) {
      // Multiple files
      fichiers.forEach((fichier, index) => {
        formData.append(`fichiers[${index}]`, fichier);
      });
    } else {
      // Single file (legacy support)
      formData.append('fichiers[]', fichiers);
    }
  }
  return api.post('/courriers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Courriers - pièces jointes
export const uploadCourrierAttachment = (courrierId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/courriers/${courrierId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Courriers - archives
export const fetchCourrierArchives = () => api.get('/courriers/archives');
export const archiveCourrier = (id) => api.post(`/courriers/${id}/archive`);
export const deleteCourrier = (id) => api.delete(`/courriers/${id}`);

// Courriers - actions de gestion
export const markCourrierAsRead = (id) => api.post(`/courriers/${id}/mark-as-read`);
export const markCourrierAsUnread = (id) => api.post(`/courriers/${id}/mark-as-unread`);
export const setCourrierPending = (id, pending_until) => 
  api.post(`/courriers/${id}/set-pending`, { pending_until });
export const removeCourrierPending = (id) => api.post(`/courriers/${id}/remove-pending`);

export const fetchStatistiques = (period = 'month') => api.get('/statistiques', { params: { period } });

// Fonctions d'admin
export const fetchAdminUsers = () => api.get('/users');
export const fetchPendingUserRequests = () => api.get('/register-requests');
export const approveUserRequest = (requestId) => api.post(`/register-requests/${requestId}/approve`);
export const rejectUserRequest = (requestId) => api.post(`/register-requests/${requestId}/reject`);
export const deleteUser = (userId) => api.delete(`/users/${userId}`);
export const toggleUserStatus = (userId, isActive) => api.patch(`/users/${userId}/status`, { is_active: isActive });
export const changeUserRole = (userId, role) => api.patch(`/users/${userId}/role`, { role });

// Réinitialisation de mot de passe
export const forgotPassword = (email) => api.post('/forgot-password', { email });
export const verifyResetCode = ({ email, code }) => api.post('/verify-reset-code', { email, code });
export const resetPassword = ({ email, code, password, password_confirmation }) => 
  api.post('/reset-password', { email, code, password, password_confirmation });
