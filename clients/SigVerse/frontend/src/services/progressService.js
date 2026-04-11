import api from './api';

export const getAllProgress = () => api.get('/progress');
export const getProgressById = (id) => api.get(`/progress/${id}`);
export const createProgress = (data) => api.post('/progress', data);
export const updateProgress = (id, data) => api.put(`/progress/${id}`, data);
export const patchProgress = (id, data) => api.patch(`/progress/${id}`, data);
export const deleteProgress = (id) => api.delete(`/progress/${id}`);
export const getLessonState = (courseId) => api.get(`/progress/course/${courseId}/lesson-state`);
export const startLessonSession = (lessonId, course_id) => api.post(`/progress/lessons/${lessonId}/start`, { course_id });
export const completeLessonSession = (lessonId, course_id) => api.post(`/progress/lessons/${lessonId}/complete`, { course_id });
