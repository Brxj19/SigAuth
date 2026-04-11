const pool = require('../../config/db.mysql');

class Course {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT
        c.*,
        u.name AS instructor_name,
        (
          SELECT COUNT(*)
          FROM modules m
          WHERE m.course_id = c.id
        ) AS module_count,
        (
          SELECT COUNT(*)
          FROM lessons l
          INNER JOIN modules m2 ON m2.id = l.module_id
          WHERE m2.course_id = c.id
        ) AS lesson_count,
        (
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.course_id = c.id
        ) AS learner_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      ORDER BY c.created_at DESC, c.id DESC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT
        c.*,
        u.name AS instructor_name,
        (
          SELECT COUNT(*)
          FROM modules m
          WHERE m.course_id = c.id
        ) AS module_count,
        (
          SELECT COUNT(*)
          FROM lessons l
          INNER JOIN modules m2 ON m2.id = l.module_id
          WHERE m2.course_id = c.id
        ) AS lesson_count,
        (
          SELECT COUNT(*)
          FROM enrollments e
          WHERE e.course_id = c.id
        ) AS learner_count
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByIdWithModules(id) {
    const course = await this.findById(id);
    if (!course) return null;
    const [modules] = await pool.query('SELECT * FROM modules WHERE course_id = ? ORDER BY sequence_order', [id]);
    for (const mod of modules) {
      const [lessons] = await pool.query('SELECT * FROM lessons WHERE module_id = ?', [mod.id]);
      mod.lessons = lessons;
    }
    course.modules = modules;
    return course;
  }

  static async create(data) {
    const { title, description, youtube_video_url = null, instructor_id } = data;
    const now = new Date();
    const [result] = await pool.query(
      'INSERT INTO courses (title, description, youtube_video_url, instructor_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [title, description, youtube_video_url || null, instructor_id, now]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { title, description, youtube_video_url = null, instructor_id } = data;
    await pool.query(
      'UPDATE courses SET title = ?, description = ?, youtube_video_url = ?, instructor_id = ? WHERE id = ?',
      [title, description, youtube_video_url || null, instructor_id, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
    if (data.youtube_video_url !== undefined) { fields.push('youtube_video_url = ?'); values.push(data.youtube_video_url || null); }
    if (data.instructor_id !== undefined) { fields.push('instructor_id = ?'); values.push(data.instructor_id); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM courses WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Course;
