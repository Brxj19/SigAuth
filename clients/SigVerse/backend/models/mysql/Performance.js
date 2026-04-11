const pool = require('../../config/db.mysql');

class Performance {
  static async findAll() {
    const [rows] = await pool.query(
      `SELECT pf.*, u.name AS user_name, c.title AS course_title 
       FROM performance pf 
       LEFT JOIN users u ON pf.user_id = u.id 
       LEFT JOIN courses c ON pf.course_id = c.id`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT pf.*, u.name AS user_name, c.title AS course_title 
       FROM performance pf 
       LEFT JOIN users u ON pf.user_id = u.id 
       LEFT JOIN courses c ON pf.course_id = c.id 
       WHERE pf.id = ?`, [id]
    );
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT pf.*, c.title AS course_title 
       FROM performance pf 
       LEFT JOIN courses c ON pf.course_id = c.id 
       WHERE pf.user_id = ?`, [userId]
    );
    return rows;
  }

  static async findByUserAndCourse(userId, courseId) {
    const [rows] = await pool.query(
      `SELECT pf.*, c.title AS course_title
       FROM performance pf
       LEFT JOIN courses c ON pf.course_id = c.id
       WHERE pf.user_id = ? AND pf.course_id = ?
       ORDER BY pf.completed_at DESC, pf.id DESC
       LIMIT 1`,
      [userId, courseId]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { user_id, course_id, score } = data;
    const [result] = await pool.query(
      'INSERT INTO performance (user_id, course_id, score, completed_at) VALUES (?, ?, ?, NOW())',
      [user_id, course_id, score]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { user_id, course_id, score } = data;
    await pool.query(
      'UPDATE performance SET user_id = ?, course_id = ?, score = ?, completed_at = NOW() WHERE id = ?',
      [user_id, course_id, score, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.user_id !== undefined) { fields.push('user_id = ?'); values.push(data.user_id); }
    if (data.course_id !== undefined) { fields.push('course_id = ?'); values.push(data.course_id); }
    if (data.score !== undefined) { fields.push('score = ?'); values.push(data.score); }
    if (data.score !== undefined) { fields.push('completed_at = NOW()'); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE performance SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async upsertByUserAndCourse(data) {
    const existing = await this.findByUserAndCourse(data.user_id, data.course_id);
    if (existing) {
      await pool.query(
        'UPDATE performance SET score = ?, completed_at = NOW() WHERE id = ?',
        [data.score, existing.id]
      );
      return this.findById(existing.id);
    }

    return this.create(data);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM performance WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Performance;
