require('dotenv').config();

const pool = require('../config/db.mysql');
const mongoose = require('../config/db.mongo');
const ActivityLog = require('../models/mongo/ActivityLog');
const AuthLog = require('../models/mongo/AuthLog');
const LearningEvent = require('../models/mongo/LearningEvent');

const SEED_DOMAIN = 'seed.eduverse.dev';
const COURSE_BLUEPRINTS = [
  ['Java Platform Foundations', 'Build reliable Java services with strong language fundamentals, testing habits, and deployment-ready workflows.'],
  ['Spring Boot API Delivery', 'Design, document, and ship maintainable APIs with layered architecture and real-world operational guardrails.'],
  ['React Product Interfaces', 'Create fast, accessible product surfaces with component-driven thinking and production-ready state patterns.'],
  ['Data Modeling for Learning Platforms', 'Model users, courses, enrollments, and analytics with schemas that scale for evolving product teams.'],
  ['Backend Quality Engineering', 'Raise release confidence with unit tests, integration checks, observability, and safer backend delivery.'],
  ['Modern JavaScript for Teams', 'Refresh the JavaScript patterns teams actually use across dashboards, forms, APIs, and reusable utilities.'],
  ['Node.js Service Architecture', 'Build structured Node services with disciplined routing, validation, error handling, and delivery pipelines.'],
  ['MongoDB Event Tracking', 'Capture product events, learning behaviors, and operational logs with durable MongoDB collection design.'],
  ['MySQL Querying for Products', 'Turn product questions into trustworthy SQL queries, indexes, and reporting-friendly relational data models.'],
  ['UX Writing for Product Teams', 'Write clearer onboarding, navigation, and system messaging that supports confidence and task completion.'],
  ['Design Systems in Practice', 'Create repeatable UI patterns, naming standards, tokens, and team-ready component decision making.'],
  ['Platform Security Essentials', 'Improve authentication, authorization, token handling, and environment management for shipping teams.'],
  ['Product Analytics Workflows', 'Use engagement and performance signals to guide better product, content, and cohort decisions.'],
  ['Agile Delivery for Engineers', 'Run healthier delivery cycles with planning rituals, execution patterns, and operational feedback loops.'],
  ['AI Literacy for Product Builders', 'Understand practical AI capabilities, workflows, risks, and implementation patterns for modern teams.'],
  ['Cloud Readiness Bootcamp', 'Prepare services, environments, and deployment standards for stable handoff into cloud infrastructure.'],
  ['Frontend Performance Studio', 'Sharpen rendering speed, loading behavior, and interaction design for high-trust product experiences.'],
  ['Technical Leadership Foundations', 'Lead engineering work with prioritization, feedback, delegation, and operational clarity.'],
  ['API Design Review Lab', 'Evaluate API contracts, versioning, validation, and client communication patterns with practical review exercises.'],
  ['Product Discovery for Engineers', 'Translate product ambiguity into engineering-ready decisions, delivery sequencing, and measurable outcomes.'],
  ['Incident Response Playbook', 'Build calmer operational habits for triage, communication, root-cause analysis, and prevention follow-through.'],
  ['Testing React Applications', 'Improve confidence in frontend behavior with component testing, interaction coverage, and resilient UI checks.'],
  ['Developer Experience Systems', 'Design local workflows, documentation, and quality gates that make teams faster without sacrificing trust.'],
  ['Observability for Backend Teams', 'Use logs, metrics, traces, and alerting patterns to make backend behavior easier to reason about.'],
  ['Customer Support for Product Engineers', 'Turn real customer issues into clearer fixes, better diagnostics, and more resilient product behavior.'],
  ['Release Management Foundations', 'Coordinate readiness, dependencies, approvals, and communication for smoother multi-team releases.'],
  ['Collaborative Code Review', 'Make pull requests easier to review with better framing, smaller changes, and stronger technical feedback loops.'],
  ['Information Architecture for Apps', 'Shape navigation, page structure, and content hierarchy so complex products feel easier to use.'],
  ['Metrics-Driven Roadmapping', 'Connect delivery choices to user outcomes, planning tradeoffs, and executive-facing decision support.'],
  ['Search and Discovery Patterns', 'Improve catalog discovery with query design, ranking inputs, filtering patterns, and behavioral signals.'],
  ['Enterprise UI Foundations', 'Build dashboards and workflow-heavy interfaces that feel reliable, consistent, and easy to scan under pressure.'],
  ['Authentication Flows in Practice', 'Implement sign-in flows, callbacks, sessions, JWT patterns, and safer account lifecycle handling.'],
  ['Data Visualization Essentials', 'Choose charts, comparisons, and summary patterns that communicate product and learning signals clearly.'],
  ['Accessibility for Product Teams', 'Improve keyboard access, readable content, semantic structure, and inclusive interaction design.'],
  ['Knowledge Base Operations', 'Design help content, internal references, and support workflows that reduce team confusion and repeat work.'],
  ['Staff-Level Communication', 'Communicate architecture, risk, and delivery decisions with clarity across engineering and product groups.']
];

const MODULE_TEMPLATES = [
  {
    name: 'Strategy and Foundations',
    lessons: ['Course framing', 'Core concepts', 'Environment setup', 'Quality checkpoints']
  },
  {
    name: 'Guided Delivery Sprint',
    lessons: ['Applied workflow', 'Hands-on build', 'Team collaboration', 'Debugging review']
  },
  {
    name: 'Production Readiness',
    lessons: ['Operational standards', 'Performance review', 'Release checklist', 'Executive recap']
  },
  {
    name: 'Capstone Application',
    lessons: ['Scenario workshop', 'Capstone build', 'Stakeholder playback', 'Improvement roadmap']
  }
];

const ADMIN_NAMES = [
  'Maya Chen',
  'Noah Bennett',
  'Priya Raman'
];

const INSTRUCTOR_NAMES = [
  'Avery Brooks',
  'Sofia Patel',
  'Ethan Walker',
  'Mia Kim',
  'Liam Foster',
  'Zara Ahmed',
  'Daniel Ortiz',
  'Chloe Martin',
  'Lucas Reed',
  'Nina Alvarez',
  'Mason Clarke',
  'Elena Vasquez',
  'Omar Siddiqui',
  'Ruby Thompson',
  'Jonah Greene',
  'Fatima Noor'
];

const LEARNER_NAMES = [
  'Olivia Turner',
  'James Cooper',
  'Emma Ross',
  'Benjamin Kelly',
  'Isabella Price',
  'William Hayes',
  'Sophia Perry',
  'Henry Ward',
  'Amelia Griffin',
  'Jack Sanders',
  'Charlotte Hughes',
  'Sebastian Flores',
  'Evelyn Simmons',
  'Alexander Barnes',
  'Harper Jenkins',
  'Michael Powell',
  'Abigail Long',
  'Elijah Bryant',
  'Ella Coleman',
  'Matthew Patterson',
  'Scarlett Howard',
  'Samuel Henderson',
  'Grace Richardson',
  'David Hughes',
  'Lily Brooks',
  'Joseph Peterson',
  'Aria Bennett',
  'Levi Ramirez',
  'Zoey Ward',
  'Gabriel Torres',
  'Hannah Fisher',
  'Julian Foster',
  'Layla Simmons',
  'Owen Butler',
  'Aubrey Watson',
  'Carter Hayes',
  'Penelope Price',
  'Wyatt James',
  'Nora Sullivan',
  'Isaac Murphy',
  'Violet Butler',
  'Leo Reynolds',
  'Madison Carter',
  'Anthony West',
  'Stella Nguyen',
  'Christopher Cole',
  'Paisley Edwards',
  'Nathan Bell',
  'Claire Rivera',
  'Aaron Wood',
  'Lucy Cooper',
  'Andrew Simmons',
  'Naomi Diaz',
  'Ryan Foster',
  'Brooklyn James',
  'Thomas Perry',
  'Elena Morris',
  'Adrian Powell',
  'Sadie Bennett',
  'Jordan Murphy',
  'Mila Turner',
  'Jonathan Torres',
  'Kennedy Richardson',
  'Charles Hayes',
  'Ruby Jenkins',
  'Eli Watson',
  'Sarah Flores',
  'Connor Barnes',
  'Allison Hughes',
  'Christian Howard',
  'Kinsley Sanders',
  'Adam Griffin',
  'Piper Ross',
  'Jeremiah Price',
  'Valeria Kelly',
  'Jason Bryant',
  'Aurora Coleman',
  'Robert Fisher',
  'Melanie Ward'
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

function createSeedEmail(name, role, index) {
  return `${slugify(name)}.${role}.${index + 1}@${SEED_DOMAIN}`;
}

function createUserRecords(names, role) {
  return names.map((name, index) => ({
    name,
    email: createSeedEmail(name, role, index),
    role
  }));
}

function average(values, key) {
  if (values.length === 0) return 0;
  return values.reduce((sum, item) => sum + Number(item[key]), 0) / values.length;
}

function buildCourseModules(courseTitle) {
  const courseLabel = courseTitle.split(' ').slice(0, 2).join(' ');
  return MODULE_TEMPLATES.map((template, templateIndex) => ({
    name: template.name,
    sequence: templateIndex + 1,
    lessons: template.lessons.map((lessonTitle, lessonIndex) => `${courseLabel}: ${lessonTitle} ${lessonIndex + 1}`)
  }));
}

function buildLessonContent(courseTitle, moduleName, lessonName, lessonIndex) {
  const topic = courseTitle.replace(/ Bootcamp| Foundations| Studio| Lab/g, '');
  const sequence = lessonIndex + 1;

  return [
    `Overview
${lessonName} is part of ${moduleName} in ${courseTitle}. This lesson is designed to move beyond surface familiarity and help the learner understand why the topic matters in real delivery work, what strong execution looks like, and where common mistakes appear in practice.`,

    `Key knowledge to build
- Define the core concepts behind ${topic} in plain language.
- Connect ${lessonName.toLowerCase()} to product, engineering, and team outcomes.
- Recognize the trade-offs that appear when quality, speed, and maintainability compete.
- Identify what an experienced practitioner would review before moving forward.`,

    `Deep explanation
Start by framing the problem this lesson solves. In strong teams, ${topic.toLowerCase()} is not treated as isolated theory; it influences planning, implementation, communication, and long-term support. Learners should understand the context, the sequence of decisions involved, and the operational impact of good versus weak execution.

Then break the lesson into smaller decision points. Ask what inputs matter, what evidence is needed, what standards define acceptable quality, and how a team would know the work is complete. This makes the lesson useful for both beginners and developing practitioners because it teaches reasoning instead of memorization.`,

    `Practice activities
1. Summarize the lesson in three sentences as if briefing a teammate.
2. List two implementation choices you would make differently in a small team versus a mature product organization.
3. Write one checklist item you would add to a review, demo, or release process after studying this topic.
4. Map this lesson to a concrete task you could complete during week ${sequence} of a real project.`,

    `Reflection prompts
- What part of this topic is easiest to overlook when a team is moving quickly?
- Which signals would tell you the current approach is working well?
- What documentation, tests, or communication would make this lesson easier to operationalize?
- If a junior teammate asked for help here, how would you coach them through the first decision?`,

    `Readiness checklist
- I can explain the lesson without copying the wording directly.
- I can connect the lesson to a real workflow, review, or delivery milestone.
- I can describe one quality risk and one mitigation pattern.
- I can identify the next lesson or module this topic should influence.`
  ].join('\n\n');
}

async function cleanupExistingSeedData(connection) {
  const [seedUsers] = await connection.query(
    'SELECT id FROM users WHERE email LIKE ?',
    [`%@${SEED_DOMAIN}`]
  );

  if (seedUsers.length === 0) return;

  const seedUserIds = seedUsers.map((row) => row.id);
  const [seedCourses] = await connection.query(
    'SELECT id FROM courses WHERE instructor_id IN (?)',
    [seedUserIds]
  );
  const seedCourseIds = seedCourses.map((row) => row.id);

  let seedLessonIds = [];
  if (seedCourseIds.length > 0) {
    const [lessons] = await connection.query(
      `SELECT l.id
       FROM lessons l
       INNER JOIN modules m ON m.id = l.module_id
       WHERE m.course_id IN (?)`,
      [seedCourseIds]
    );
    seedLessonIds = lessons.map((row) => row.id);
  }

  await Promise.all([
    ActivityLog.deleteMany({ user_id: { $in: seedUserIds } }),
    AuthLog.deleteMany({ user_id: { $in: seedUserIds } }),
    LearningEvent.deleteMany({
      $or: [
        { user_id: { $in: seedUserIds } },
        { course_id: { $in: seedCourseIds.length ? seedCourseIds : [-1] } },
        { lesson_id: { $in: seedLessonIds.length ? seedLessonIds : [-1] } }
      ]
    })
  ]);

  await connection.query('DELETE FROM users WHERE email LIKE ?', [`%@${SEED_DOMAIN}`]);
}

async function insertUsers(connection, users) {
  const created = [];

  for (const user of users) {
    const [result] = await connection.query(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [user.name, user.email, user.role]
    );
    created.push({ ...user, id: result.insertId });
  }

  return created;
}

async function insertCourse(connection, course, instructorId) {
  const [result] = await connection.query(
    'INSERT INTO courses (title, description, instructor_id) VALUES (?, ?, ?)',
    [course.title, course.description, instructorId]
  );

  return result.insertId;
}

async function insertModule(connection, courseId, module) {
  const [result] = await connection.query(
    'INSERT INTO modules (course_id, module_name, sequence_order) VALUES (?, ?, ?)',
    [courseId, module.name, module.sequence]
  );

  return result.insertId;
}

async function insertLesson(connection, moduleId, lessonName, lessonIndex, courseTitle, moduleName) {
  const [result] = await connection.query(
    'INSERT INTO lessons (module_id, lesson_name, content) VALUES (?, ?, ?)',
    [
      moduleId,
      lessonName,
      buildLessonContent(courseTitle, moduleName, lessonName, lessonIndex)
    ]
  );

  return result.insertId;
}

async function insertEnrollmentBundle(connection, enrollment) {
  const [enrollmentResult] = await connection.query(
    'INSERT INTO enrollments (user_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?)',
    [enrollment.userId, enrollment.courseId, enrollment.status, enrollment.enrolledAt]
  );

  const [progressResult] = await connection.query(
    'INSERT INTO progress (user_id, course_id, completion_percentage, last_accessed) VALUES (?, ?, ?, ?)',
    [enrollment.userId, enrollment.courseId, enrollment.completion, enrollment.lastAccessed]
  );

  let performanceId = null;
  if (enrollment.score !== null) {
    const [performanceResult] = await connection.query(
      'INSERT INTO performance (user_id, course_id, score, completed_at) VALUES (?, ?, ?, ?)',
      [enrollment.userId, enrollment.courseId, enrollment.score, enrollment.completedAt]
    );
    performanceId = performanceResult.insertId;
  }

  return {
    enrollmentId: enrollmentResult.insertId,
    progressId: progressResult.insertId,
    performanceId
  };
}

function buildEnrollmentPlans(learners, courses) {
  const pairs = [];
  const seen = new Set();

  learners.forEach((learner, index) => {
    const preferredCourseIndexes = [
      index % courses.length,
      (index * 3 + 5) % courses.length
    ];

    if (index % 4 === 0) {
      preferredCourseIndexes.push((index * 5 + 7) % courses.length);
    }

    preferredCourseIndexes.forEach((courseIndex, offset) => {
      const course = courses[courseIndex];
      const pairKey = `${learner.id}:${course.id}`;

      if (seen.has(pairKey)) return;
      seen.add(pairKey);

      const completion = Math.min(100, 22 + ((index * 11 + offset * 17) % 79));
      const completed = completion >= 78;
      const month = String((index % 9) + 1).padStart(2, '0');
      const day = String(((index * 2 + offset * 3) % 27) + 1).padStart(2, '0');

      pairs.push({
        userId: learner.id,
        courseId: course.id,
        completion,
        status: completed ? 'completed' : 'active',
        enrolledAt: `2026-${month}-${day} 09:00:00`,
        lastAccessed: `2026-${month}-${String(Math.min(28, Number(day) + 1)).padStart(2, '0')} 15:30:00`,
        score: completed ? 72 + ((index + offset * 9) % 27) : null,
        completedAt: completed ? `2026-${month}-${String(Math.min(28, Number(day) + 4)).padStart(2, '0')} 18:15:00` : null
      });
    });
  });

  return pairs;
}

async function seedMongoCollections({ users, courses, lessons, enrollments }) {
  const allUsers = users.instructors.concat(users.learners, users.admins);

  const authLogs = allUsers.flatMap((user, index) => ([
    {
      user_id: user.id,
      provider: 'github',
      status: 'success',
      timestamp: new Date(`2026-02-${String((index % 26) + 1).padStart(2, '0')}T08:00:00Z`)
    },
    {
      user_id: user.id,
      provider: 'github',
      status: index % 6 === 0 ? 'failure' : 'success',
      timestamp: new Date(`2026-03-${String((index % 24) + 1).padStart(2, '0')}T10:30:00Z`)
    }
  ]));

  const activityLogs = enrollments.slice(0, 260).map((enrollment, index) => {
    const modules = ['courses', 'enrollments', 'progress', 'performance'];
    const module = modules[index % modules.length];
    const actionMap = {
      courses: `GET /courses/${enrollment.courseId}`,
      enrollments: 'POST /enrollments',
      progress: `PATCH /progress/${index + 1}`,
      performance: 'GET /performance'
    };

    return {
      user_id: enrollment.userId,
      action: actionMap[module],
      module,
      metadata: {
        source: 'seed',
        course_id: enrollment.courseId,
        status: enrollment.status
      },
      timestamp: new Date(`2026-03-${String((index % 24) + 1).padStart(2, '0')}T${String((index % 10) + 8).padStart(2, '0')}:15:00Z`)
    };
  });

  const learningEvents = enrollments.slice(0, 320).flatMap((enrollment, index) => {
    const lesson = lessons[index % lessons.length];
    const startTime = new Date(`2026-03-${String((index % 24) + 1).padStart(2, '0')}T12:00:00Z`);

    const events = [
      {
        user_id: enrollment.userId,
        course_id: enrollment.courseId,
        lesson_id: lesson.id,
        action: 'start',
        timestamp: startTime
      }
    ];

    if (index % 2 === 0) {
      events.push({
        user_id: enrollment.userId,
        course_id: enrollment.courseId,
        lesson_id: lesson.id,
        action: 'complete',
        timestamp: new Date(startTime.getTime() + 36 * 60 * 1000)
      });
    }

    return events;
  });

  await Promise.all([
    AuthLog.insertMany(authLogs, { ordered: false }),
    ActivityLog.insertMany(activityLogs, { ordered: false }),
    LearningEvent.insertMany(learningEvents, { ordered: false })
  ]);

  return {
    authLogs: authLogs.length,
    activityLogs: activityLogs.length,
    learningEvents: learningEvents.length
  };
}

async function main() {
  const connection = await pool.getConnection();

  try {
    await cleanupExistingSeedData(connection);
    await connection.beginTransaction();

    const admins = await insertUsers(connection, createUserRecords(ADMIN_NAMES, 'admin'));
    const instructors = await insertUsers(connection, createUserRecords(INSTRUCTOR_NAMES, 'instructor'));
    const learners = await insertUsers(connection, createUserRecords(LEARNER_NAMES, 'learner'));

    const courses = [];
    const modules = [];
    const lessons = [];

    for (let courseIndex = 0; courseIndex < COURSE_BLUEPRINTS.length; courseIndex += 1) {
      const [title, description] = COURSE_BLUEPRINTS[courseIndex];
      const instructor = instructors[courseIndex % instructors.length];
      const courseId = await insertCourse(connection, { title, description }, instructor.id);
      const courseRecord = { id: courseId, title, instructor_id: instructor.id };
      courses.push(courseRecord);

      const courseModules = buildCourseModules(title);
      for (const module of courseModules) {
        const moduleId = await insertModule(connection, courseId, module);
        const moduleRecord = { id: moduleId, course_id: courseId, module_name: module.name };
        modules.push(moduleRecord);

        for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
          const lessonName = module.lessons[lessonIndex];
          const lessonId = await insertLesson(connection, moduleId, lessonName, lessonIndex, title, module.name);
          lessons.push({ id: lessonId, module_id: moduleId, lesson_name: lessonName, course_id: courseId });
        }
      }
    }

    const enrollmentPlans = buildEnrollmentPlans(learners, courses);
    for (const enrollment of enrollmentPlans) {
      await insertEnrollmentBundle(connection, enrollment);
    }

    await connection.commit();

    const mongoCounts = await seedMongoCollections({
      users: { admins, instructors, learners },
      courses,
      lessons,
      enrollments: enrollmentPlans
    });

    const completedCount = enrollmentPlans.filter((item) => item.status === 'completed').length;
    const avgCompletion = average(enrollmentPlans, 'completion').toFixed(1);

    console.log('Sample data seeded successfully.');
    console.log(`MySQL: ${admins.length + instructors.length + learners.length} users, ${courses.length} courses, ${modules.length} modules, ${lessons.length} lessons.`);
    console.log(`MySQL: ${enrollmentPlans.length} enrollments, ${enrollmentPlans.length} progress records, ${completedCount} performance-ready completions.`);
    console.log(`MongoDB: ${mongoCounts.authLogs} auth logs, ${mongoCounts.activityLogs} activity logs, ${mongoCounts.learningEvents} learning events.`);
    console.log(`Average seeded progress: ${avgCompletion}%`);
  } catch (error) {
    try {
      await connection.rollback();
    } catch (_) {
      // Ignore rollback errors if the transaction did not start cleanly.
    }
    console.error('Sample data seeding failed:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
    await mongoose.connection.close();
  }
}

main();
