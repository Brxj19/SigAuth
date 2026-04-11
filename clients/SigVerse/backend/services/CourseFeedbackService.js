const CourseFeedbackRepository = require('../repositories/CourseFeedbackRepository');
const EnrollmentRepository = require('../repositories/EnrollmentRepository');
const CourseRepository = require('../repositories/CourseRepository');

class CourseFeedbackService {
  static async getLearnerCourseFeedback(learnerId, courseId) {
    return CourseFeedbackRepository.findByLearnerAndCourse(learnerId, courseId);
  }

  static async getInstructorFeedback(instructorId, courseId = null) {
    const feedback = await CourseFeedbackRepository.findByInstructorId(instructorId);

    if (!courseId) return feedback;

    return feedback.filter((item) => item.course_id === Number(courseId));
  }

  static async upsertForLearner(learnerId, data) {
    const courseId = Number(data.course_id);
    const enrollment = await EnrollmentRepository.findByUserAndCourse(learnerId, courseId);

    if (!enrollment) {
      const err = new Error('You must be enrolled in this course before leaving feedback');
      err.status = 403;
      throw err;
    }

    const course = await CourseRepository.findById(courseId);
    if (!course) {
      const err = new Error('Course not found');
      err.status = 404;
      throw err;
    }

    return CourseFeedbackRepository.upsert({
      course_id: courseId,
      learner_id: learnerId,
      instructor_id: course.instructor_id,
      course_rating: Number(data.course_rating),
      instructor_rating: Number(data.instructor_rating),
      feedback: data.feedback.trim()
    });
  }

  static async getCourseFeedback(courseId) {
    return CourseFeedbackRepository.findByCourseId(courseId);
  }

  static async addInstructorReply(instructorId, feedbackId, reply) {
    const result = await CourseFeedbackRepository.addInstructorReply(feedbackId, instructorId, reply);
    if (!result) {
      const err = new Error('Feedback not found or you are not the instructor for this course');
      err.status = 404;
      throw err;
    }
    return result;
  }
}

module.exports = CourseFeedbackService;
