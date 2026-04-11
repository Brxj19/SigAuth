const mysql = require('mysql2/promise');

// const pool = mysql.createPool({
//   host: process.env.MYSQL_HOST,
//   port: parseInt(process.env.MYSQL_PORT) || 3306,
//   user: process.env.MYSQL_USER,
//   password: process.env.MYSQL_PASSWORD,
//   database: process.env.MYSQL_DATABASE,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let schemaEnhancementPromise = null;

async function ensureColumn(tableName, columnName, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (rows[0]?.count > 0) return;

  await pool.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
  console.log(`✅ Added ${tableName}.${columnName}`);
}

function ensureMySqlSchema() {
  if (schemaEnhancementPromise) return schemaEnhancementPromise;

  schemaEnhancementPromise = (async () => {
    await ensureColumn('courses', 'youtube_video_url', 'VARCHAR(500) NULL AFTER description');
    await ensureColumn('lessons', 'youtube_video_url', 'VARCHAR(500) NULL AFTER content');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        learner_id INT NOT NULL,
        instructor_id INT NOT NULL,
        course_rating TINYINT NOT NULL,
        instructor_rating TINYINT NOT NULL,
        feedback TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_course_feedback (course_id, learner_id),
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        FOREIGN KEY (learner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  })().catch((err) => {
    schemaEnhancementPromise = null;
    throw err;
  });

  return schemaEnhancementPromise;
}

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
  });

module.exports = pool;
module.exports.ensureMySqlSchema = ensureMySqlSchema;
