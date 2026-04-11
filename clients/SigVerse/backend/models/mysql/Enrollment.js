const pool = require('../../config/db.mysql');

class Enrollment {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS user_name, c.title AS course_title 
       FROM enrollments e 
       LEFT JOIN users u ON e.user_id = u.id 
       LEFT JOIN courses c ON e.course_id = c.id`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, u.name AS user_name, c.title AS course_title 
       FROM enrollments e 
       LEFT JOIN users u ON e.user_id = u.id 
       LEFT JOIN courses c ON e.course_id = c.id 
       WHERE e.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT e.*, c.title AS course_title, c.description AS course_description 
       FROM enrollments e 
       LEFT JOIN courses c ON e.course_id = c.id 
       WHERE e.user_id = ?`, [userId]
    );
    return rows;
  }

  static async findByUserAndCourse(userId, courseId) {
    const [rows] = await pool.query(
      'SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { user_id, course_id, status = 'active' } = data;
    const now = new Date();
    const [result] = await pool.query(
      'INSERT INTO enrollments (user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?)',
      [user_id, course_id, status, now]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { user_id, course_id, status } = data;
    await pool.query(
      'UPDATE enrollments SET user_id = ?, course_id = ?, status = ? WHERE id = ?',
      [user_id, course_id, status, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.user_id !== undefined) { fields.push('user_id = ?'); values.push(data.user_id); }
    if (data.course_id !== undefined) { fields.push('course_id = ?'); values.push(data.course_id); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE enrollments SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM enrollments WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Enrollment;
