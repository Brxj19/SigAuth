const pool = require('../../config/db.mysql');

class Lesson {
  static async findAll() {
    const [rows] = await pool.query('SELECT l.*, m.module_name FROM lessons l LEFT JOIN modules m ON l.module_id = m.id');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT l.*, m.module_name FROM lessons l LEFT JOIN modules m ON l.module_id = m.id WHERE l.id = ?', [id]);
    return rows[0] || null;
  }

  static async findByModuleId(moduleId) {
    const [rows] = await pool.query('SELECT * FROM lessons WHERE module_id = ?', [moduleId]);
    return rows;
  }

  static async create(data) {
    const { module_id, lesson_name, content, youtube_video_url = null } = data;
    const [result] = await pool.query(
      'INSERT INTO lessons (module_id, lesson_name, content, youtube_video_url) VALUES (?, ?, ?, ?)',
      [module_id, lesson_name, content, youtube_video_url || null]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { module_id, lesson_name, content, youtube_video_url = null } = data;
    await pool.query(
      'UPDATE lessons SET module_id = ?, lesson_name = ?, content = ?, youtube_video_url = ? WHERE id = ?',
      [module_id, lesson_name, content, youtube_video_url || null, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.module_id !== undefined) { fields.push('module_id = ?'); values.push(data.module_id); }
    if (data.lesson_name !== undefined) { fields.push('lesson_name = ?'); values.push(data.lesson_name); }
    if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
    if (data.youtube_video_url !== undefined) { fields.push('youtube_video_url = ?'); values.push(data.youtube_video_url || null); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM lessons WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Lesson;
