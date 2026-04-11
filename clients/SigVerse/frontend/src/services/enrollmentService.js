import api from './api';

export const getAllEnrollments = () => api.get('/enrollments');
export const getEnrollmentById = (id) => api.get(`/enrollments/${id}`);
export const createEnrollment = (data) => api.post('/enrollments', data);
export const updateEnrollment = (id, data) => api.put(`/enrollments/${id}`, data);
export const patchEnrollment = (id, data) => api.patch(`/enrollments/${id}`, data);
export const deleteEnrollment = (id) => api.delete(`/enrollments/${id}`);
