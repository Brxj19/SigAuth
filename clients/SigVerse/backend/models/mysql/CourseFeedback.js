const pool = require('../../config/db.mysql');

class CourseFeedback {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT
        cf.*,
        c.title AS course_title,
        learner.name AS learner_name,
        learner.email AS learner_email,
        instructor.name AS instructor_name
      FROM course_feedback cf
      INNER JOIN courses c ON c.id = cf.course_id
      INNER JOIN users learner ON learner.id = cf.learner_id
      INNER JOIN users instructor ON instructor.id = cf.instructor_id
      ORDER BY cf.updated_at DESC, cf.id DESC`
    );

    return rows;
  }

  static async findByLearnerAndCourse(learnerId, courseId) {
    const [rows] = await pool.query(
      `SELECT
        cf.*,
        c.title AS course_title,
        learner.name AS learner_name,
        learner.email AS learner_email,
        instructor.name AS instructor_name
      FROM course_feedback cf
      INNER JOIN courses c ON c.id = cf.course_id
      INNER JOIN users learner ON learner.id = cf.learner_id
      INNER JOIN users instructor ON instructor.id = cf.instructor_id
      WHERE cf.learner_id = ? AND cf.course_id = ?
      LIMIT 1`,
      [learnerId, courseId]
    );

    return rows[0] || null;
  }

  static async findByInstructorId(instructorId) {
    const [rows] = await pool.query(
      `SELECT
        cf.*,
        c.title AS course_title,
        learner.name AS learner_name,
        learner.email AS learner_email,
        instructor.name AS instructor_name
      FROM course_feedback cf
      INNER JOIN courses c ON c.id = cf.course_id
      INNER JOIN users learner ON learner.id = cf.learner_id
      INNER JOIN users instructor ON instructor.id = cf.instructor_id
      WHERE cf.instructor_id = ?
      ORDER BY cf.updated_at DESC, cf.id DESC`,
      [instructorId]
    );

    return rows;
  }

  static async upsert(data) {
    const {
      course_id,
      learner_id,
      instructor_id,
      course_rating,
      instructor_rating,
      feedback
    } = data;

    const now = new Date();
    await pool.query(
      `INSERT INTO course_feedback (
        course_id,
        learner_id,
        instructor_id,
        course_rating,
        instructor_rating,
        feedback,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        instructor_id = VALUES(instructor_id),
        course_rating = VALUES(course_rating),
        instructor_rating = VALUES(instructor_rating),
        feedback = VALUES(feedback),
        updated_at = CURRENT_TIMESTAMP`,
      [
        course_id,
        learner_id,
        instructor_id,
        course_rating,
        instructor_rating,
        feedback,
        now,
        now
      ]
    );

    return this.findByLearnerAndCourse(learner_id, course_id);
  }

  static async findByCourseId(courseId) {
    const [rows] = await pool.query(
      `SELECT
        cf.*,
        c.title AS course_title,
        learner.name AS learner_name,
        learner.email AS learner_email,
        instructor.name AS instructor_name
      FROM course_feedback cf
      INNER JOIN courses c ON c.id = cf.course_id
      INNER JOIN users learner ON learner.id = cf.learner_id
      INNER JOIN users instructor ON instructor.id = cf.instructor_id
      WHERE cf.course_id = ?
      ORDER BY cf.updated_at DESC`,
      [courseId]
    );
    return rows;
  }

  static async addInstructorReply(feedbackId, instructorId, reply) {
    const [result] = await pool.query(
      `UPDATE course_feedback SET instructor_reply = ?, updated_at = NOW() WHERE id = ? AND instructor_id = ?`,
      [reply, feedbackId, instructorId]
    );
    if (result.affectedRows === 0) return null;
    const [rows] = await pool.query('SELECT * FROM course_feedback WHERE id = ?', [feedbackId]);
    return rows[0] || null;
  }
}

module.exports = CourseFeedback;
