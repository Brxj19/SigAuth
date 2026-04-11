const pool = require('../../config/db.mysql');

// User model for MySQL database
class User {
  static async findAll() {
    const [rows] = await pool.query('SELECT id, name, email, role, github_id, avatar_url, created_at, updated_at FROM users');
    return rows;
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT id, name, email, role, avatar_url, created_at, updated_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // Find user by GitHub ID
  static async findByGithubId(github_id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE github_id = ?', [github_id]);
    return rows[0] || null;
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  // Create a new user
  static async create(data) {
    const { name, email, role = 'learner', github_id = null, avatar_url = null } = data;
    const now = new Date();
    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, github_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, role, github_id, avatar_url, now, now]
    );
    return this.findById(result.insertId);
  }

  // Update an existing user
  static async update(id, data) {
    const { name, email, role } = data;
    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ?, updated_at = NOW() WHERE id = ?',
      [name, email, role, id]
    );
    return this.findById(id);
  }

  // Partially update an existing user
  static async patch(id, data) {
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
    if (fields.length === 0) return this.findById(id);
    fields.push('updated_at = NOW()');
    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }
  // Delete a user
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = User;
