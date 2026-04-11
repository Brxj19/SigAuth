import api from './api';

// Approval service for managing approval requests
export const getApprovals = () => api.get('/approvals');
export const approveRequest = (id) => api.post(`/approvals/${id}/approve`);
export const rejectRequest = (id, note = '') => api.post(`/approvals/${id}/reject`, { note });
