-- ============================================
-- EdTech Course Enrollment System - MySQL Schema
-- Run in exact order to avoid FK constraint errors
-- ============================================

CREATE DATABASE IF NOT EXISTS edtech_db;
USE edtech_db;

-- Table: users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('learner','instructor','admin') NOT NULL DEFAULT 'learner',
  github_id VARCHAR(100) UNIQUE,
  avatar_url VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: courses
CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_video_url VARCHAR(500),
  instructor_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: modules
CREATE TABLE modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  sequence_order INT NOT NULL DEFAULT 1,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table: lessons
CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  lesson_name VARCHAR(255) NOT NULL,
  content TEXT,
  youtube_video_url VARCHAR(500),
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- Table: enrollments
CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  status ENUM('active','completed') NOT NULL DEFAULT 'active',
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_course (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table: progress
CREATE TABLE progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_course_prog (user_id, course_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table: performance
CREATE TABLE performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Table: course_feedback
CREATE TABLE course_feedback (
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
);

-- ============================================
-- Sample Data - Insert in exact order
-- ============================================

-- 1. Insert users
INSERT INTO users (id, name, email, role) VALUES
  (1, 'Alice Smith', 'alice@example.com', 'instructor'),
  (2, 'Bob Learner', 'bob@example.com', 'learner'),
  (3, 'Carol Admin', 'carol@example.com', 'admin');

-- 2. Insert course
INSERT INTO courses (id, title, description, youtube_video_url, instructor_id) VALUES
  (1, 'Java Basics', 'Introduction to Java programming', 'https://www.youtube.com/watch?v=eIrMbAQSU34', 1);

-- 3. Insert module
INSERT INTO modules (id, course_id, module_name, sequence_order) VALUES
  (1, 1, 'Introduction', 1);

-- 4. Insert lesson
INSERT INTO lessons (id, module_id, lesson_name, content, youtube_video_url) VALUES
  (1, 1, 'Variables', 'Content about Java variables here', 'https://www.youtube.com/watch?v=gooioS8nKTE');

-- 5. Enroll Bob in the course
INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at) VALUES
  (1, 2, 1, 'active', '2026-01-01 00:00:00');

-- 6. Set progress for Bob
INSERT INTO progress (id, user_id, course_id, completion_percentage, last_accessed) VALUES
  (1, 2, 1, 40.00, '2026-01-05 00:00:00');

-- 7. Add sample learner feedback
INSERT INTO course_feedback (
  id,
  course_id,
  learner_id,
  instructor_id,
  course_rating,
  instructor_rating,
  feedback
) VALUES
  (1, 1, 2, 1, 5, 4, 'Helpful pacing, clear explanations, and a strong start for beginners.');
