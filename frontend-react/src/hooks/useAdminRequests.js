import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fetchPendingRequests, approveRequest, rejectRequest } from '../services/api';

export const useAdminRequests = () => {
  const { user } = useSelector((state) => state.auth);
  const [adminRequests, setAdminRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les demandes en attente si l'utilisateur est admin
  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminRequests();
    }
  }, [user]);

  const loadAdminRequests = async () => {
    setLoading(true);
    try {
      const { data } = await fetchPendingRequests();
      // Filtrer uniquement les demandes de rôle admin
      const adminOnlyRequests = (data.data || []).filter(request => request.role === 'admin');
      setAdminRequests(adminOnlyRequests);
    } catch (error) {
      console.error('Erreur lors du chargement des demandes admin:', error);
      setAdminRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await approveRequest(requestId);
      // Recharger la liste après approbation
      await loadAdminRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      return false;
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await rejectRequest(requestId);
      // Recharger la liste après rejet
      await loadAdminRequests();
      return true;
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      return false;
    }
  };

  return {
    adminRequests,
    loading,
    loadAdminRequests,
    approveRequest: handleApproveRequest,
    rejectRequest: handleRejectRequest,
    isAdmin: user?.role === 'admin'
  };
};
