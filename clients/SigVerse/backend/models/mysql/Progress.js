const pool = require('../../config/db.mysql');

class Progress {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS user_name, c.title AS course_title 
       FROM progress p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN courses c ON p.course_id = c.id`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS user_name, c.title AS course_title 
       FROM progress p 
       LEFT JOIN users u ON p.user_id = u.id 
       LEFT JOIN courses c ON p.course_id = c.id 
       WHERE p.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT p.*, c.title AS course_title 
       FROM progress p 
       LEFT JOIN courses c ON p.course_id = c.id 
       WHERE p.user_id = ?`, [userId]
    );
    return rows;
  }

  static async findByUserAndCourse(userId, courseId) {
    const [rows] = await pool.query(
      'SELECT * FROM progress WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { user_id, course_id, completion_percentage = 0 } = data;
    const now = new Date();
    const [result] = await pool.query(
      'INSERT INTO progress (user_id, course_id, completion_percentage, last_accessed) VALUES (?, ?, ?, ?)',
      [user_id, course_id, completion_percentage, now]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { user_id, course_id, completion_percentage } = data;
    await pool.query(
      'UPDATE progress SET user_id = ?, course_id = ?, completion_percentage = ?, last_accessed = NOW() WHERE id = ?',
      [user_id, course_id, completion_percentage, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.user_id !== undefined) { fields.push('user_id = ?'); values.push(data.user_id); }
    if (data.course_id !== undefined) { fields.push('course_id = ?'); values.push(data.course_id); }
    if (data.completion_percentage !== undefined) { fields.push('completion_percentage = ?'); values.push(data.completion_percentage); }
    fields.push('last_accessed = NOW()');
    values.push(id);
    await pool.query(`UPDATE progress SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM progress WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Progress;
