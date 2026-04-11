import api from './api';

export const getAllCourses = () => api.get('/courses');
export const getCourseById = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const patchCourse = (id, data) => api.patch(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);
