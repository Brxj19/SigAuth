import api from './api';

export const getAllPerformance = () => api.get('/performance');
export const getPerformanceById = (id) => api.get(`/performance/${id}`);
export const createPerformance = (data) => api.post('/performance', data);
export const updatePerformance = (id, data) => api.put(`/performance/${id}`, data);
export const patchPerformance = (id, data) => api.patch(`/performance/${id}`, data);
export const deletePerformance = (id) => api.delete(`/performance/${id}`);
