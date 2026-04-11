const pool = require('../../config/db.mysql');

class Module {
  static async findAll() {
    const [rows] = await pool.query('SELECT m.*, c.title AS course_title FROM modules m LEFT JOIN courses c ON m.course_id = c.id ORDER BY m.sequence_order');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT m.*, c.title AS course_title FROM modules m LEFT JOIN courses c ON m.course_id = c.id WHERE m.id = ?', [id]);
    return rows[0] || null;
  }

  static async findByIdWithLessons(id) {
    const mod = await this.findById(id);
    if (!mod) return null;
    const [lessons] = await pool.query('SELECT * FROM lessons WHERE module_id = ?', [id]);
    mod.lessons = lessons;
    return mod;
  }

  static async findByCourseId(courseId) {
    const [rows] = await pool.query('SELECT * FROM modules WHERE course_id = ? ORDER BY sequence_order', [courseId]);
    return rows;
  }

  static async create(data) {
    const { course_id, module_name, sequence_order } = data;
    const [result] = await pool.query(
      'INSERT INTO modules (course_id, module_name, sequence_order) VALUES (?, ?, ?)',
      [course_id, module_name, sequence_order]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { course_id, module_name, sequence_order } = data;
    await pool.query(
      'UPDATE modules SET course_id = ?, module_name = ?, sequence_order = ? WHERE id = ?',
      [course_id, module_name, sequence_order, id]
    );
    return this.findById(id);
  }

  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.course_id !== undefined) { fields.push('course_id = ?'); values.push(data.course_id); }
    if (data.module_name !== undefined) { fields.push('module_name = ?'); values.push(data.module_name); }
    if (data.sequence_order !== undefined) { fields.push('sequence_order = ?'); values.push(data.sequence_order); }
    if (fields.length === 0) return this.findById(id);
    values.push(id);
    await pool.query(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM modules WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Module;
