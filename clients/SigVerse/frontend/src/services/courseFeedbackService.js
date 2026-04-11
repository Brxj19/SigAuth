import api from './api';

export const getMyCourseFeedback = (courseId) => api.get(`/course-feedback/mine/${courseId}`);
export const getInstructorCourseFeedback = (courseId) => api.get('/course-feedback/instructor', {
  params: courseId ? { course_id: courseId } : undefined
});
export const saveCourseFeedback = (data) => api.post('/course-feedback', data);
export const getCourseFeedback = (courseId) => api.get(`/course-feedback/course/${courseId}`);
export const replyToFeedback = (feedbackId, reply) => api.post(`/course-feedback/${feedbackId}/reply`, { reply });
