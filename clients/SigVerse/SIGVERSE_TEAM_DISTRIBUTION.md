# Sigverse Team Distribution and Detailed Project Guide

## 1. Purpose of This Document

This document is meant to do two things:

1. Split the full-stack project clearly across 7 team members.
2. Serve as a detailed reference guide for understanding how every major part of the codebase works.

Keep this file beside `README.md` and use it as the main internal handoff and onboarding guide.

---

## 2. Project Summary

### 2.1 What This Project Is

Sigverse is a full-stack learning platform for:

- course discovery
- learner enrollment
- lesson-by-lesson progress tracking
- quiz authoring and submission
- performance tracking
- instructor content management
- admin approval workflows
- local and GitHub-based authentication
- certificate and PDF generation

### 2.2 Core Tech Stack

#### Frontend

- React 19
- React Router
- Axios
- Vite
- plain CSS in a single global stylesheet

#### Backend

- Node.js
- Express
- JWT authentication
- Passport GitHub OAuth
- Joi validation
- Nodemailer for OTP email delivery

#### Databases

- MySQL for relational business data
- MongoDB for auth credentials, approvals, OTPs, quizzes, and logs

### 2.3 Important Architectural Reality

This project is a hybrid database application:

- MySQL stores structured product data such as users, courses, modules, lessons, enrollments, progress, and performance.
- MongoDB stores workflow and operational data such as local credentials, approval requests, OTP records, learning events, quiz definitions, and activity logs.

This is the most important concept for understanding the codebase.

### 2.4 Naming Note

The root `README.md` calls the project `EduVerse`, while the UI and many files use `Sigverse`. Treat them as the same project, but note the branding inconsistency.

---

## 3. High-Level System Architecture

### 3.1 Runtime Architecture

```text
Frontend (React + Vite)
    |
    | HTTP + Bearer JWT
    v
Backend (Express)
    |
    |---- MySQL
    |       - users
    |       - courses
    |       - modules
    |       - lessons
    |       - enrollments
    |       - progress
    |       - performance
    |
    |---- MongoDB
            - local_credentials
            - email_otps
            - approval_requests
            - module_quizzes
            - activity_logs
            - auth_logs
            - learning_events
```

### 3.2 Request Flow Pattern

Most backend features follow this chain:

```text
Route -> Middleware -> Controller -> Service -> Repository/Model -> Database
```

### 3.3 Frontend Flow Pattern

Most frontend features follow this chain:

```text
Page -> Hook/Component -> Service -> Axios API client -> Backend endpoint
```

---

## 4. Recommended Distribution Across 7 Team Members

This split is designed for real ownership, minimal overlap, and easier code reviews.

## 4.1 Team Member 1: Platform Engineering, App Composition, Environment, and Data Foundations - Tanisha & Sidhartha

### Primary Scope

- backend composition root and startup orchestration
- environment contract and config loading
- MySQL and MongoDB connection infrastructure
- cache, shared middleware, and response/error conventions
- shared frontend API bootstrap and provider bootstrapping
- database setup and seed data
- project bootstrapping and tooling
- project-level documentation

### Main Files

- `README.md`
- `backend/.env`
- `backend/server.js`
- `backend/app.js`
- `backend/schema.sql`
- `backend/scripts/seedSampleData.js`
- `backend/config/db.mysql.js`
- `backend/config/db.mongo.js`
- `backend/config/cache.js`
- `backend/config/constants.js`
- `backend/middlewares/errorHandler.js`
- `backend/middlewares/rateLimiter.js`
- `backend/middlewares/logger.js`
- `backend/utils/response.js`
- `backend/package.json`
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/eslint.config.js`
- `frontend/src/main.jsx`
- `frontend/src/services/api.js`
- `frontend/src/utils/constants.js`

### Responsibilities

- Make the full stack run locally for everyone and keep the startup flow stable.
- Own environment variable contracts between frontend and backend.
- Maintain MySQL and MongoDB connection setup, cache behavior, and seed script health.
- Own shared middleware behavior such as rate limiting, activity logging, and error response shape.
- Keep the shared Axios base URL, auth header injection, and 401 redirect behavior aligned with backend auth expectations.
- Track cross-cutting integration issues that touch routing, providers, database wiring, or startup order.
- Keep root docs and onboarding docs updated.

### Why This Ownership Makes Sense

This member is not just the setup owner; they are the platform integrator. These files decide whether the app boots correctly, talks to both databases, applies shared middleware safely, and gives every domain owner a stable environment to build on.

---

## 4.2 Team Member 2: Authentication, Authorization, Session Flow, and Identity - siya

### Primary Scope

- login
- signup
- forgot password
- OTP workflows
- GitHub OAuth
- JWT creation and validation
- protected routes
- logout behavior

### Main Backend Files

- `backend/routes/auth.routes.js`
- `backend/controllers/AuthController.js`
- `backend/services/AuthService.js`
- `backend/services/OtpService.js`
- `backend/services/EmailService.js`
- `backend/services/BootstrapService.js`
- `backend/config/passport.js`
- `backend/models/mongo/LocalCredential.js`
- `backend/models/mongo/EmailOtp.js`
- `backend/models/mongo/AuthLog.js`
- `backend/middlewares/authenticate.js`
- `backend/middlewares/authorize.js`
- `backend/utils/jwt.js`
- `backend/utils/validators/authValidator.js`

### Main Frontend Files

- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/AuthCallback.jsx`
- `frontend/src/hooks/useAuth.js`
- `frontend/src/services/authService.js`
- `frontend/src/components/ProtectedRoute.jsx`
- `frontend/src/components/Navbar.jsx`

### Responsibilities

- Own all sign-in and sign-up behavior.
- Keep role enforcement consistent between frontend and backend.
- Maintain local credential storage and OTP safety.
- Keep OAuth and local auth aligned.
- Handle session expiry and token invalidation behavior.

### Why This Ownership Makes Sense

This is a full identity slice: database credential storage, auth APIs, JWTs, frontend login experience, and protected navigation.

---

## 4.3 Team Member 3: Course Catalog and Content Structure - tanisha & Saurabh

### Primary Scope

- course CRUD
- module CRUD
- lesson CRUD
- catalog browsing
- course detail rendering
- content structure and organization

### Main Backend Files

- `backend/routes/course.routes.js`
- `backend/routes/module.routes.js`
- `backend/routes/lesson.routes.js`
- `backend/controllers/CourseController.js`
- `backend/controllers/ModuleController.js`
- `backend/controllers/LessonController.js`
- `backend/services/CourseService.js`
- `backend/services/ModuleService.js`
- `backend/services/LessonService.js`
- `backend/services/InstructorScopeService.js`
- `backend/repositories/CourseRepository.js`
- `backend/repositories/ModuleRepository.js`
- `backend/repositories/LessonRepository.js`
- `backend/models/mysql/Course.js`
- `backend/models/mysql/Module.js`
- `backend/models/mysql/Lesson.js`
- `backend/utils/validators/courseValidator.js`
- `backend/utils/validators/moduleValidator.js`
- `backend/utils/validators/lessonValidator.js`

### Main Frontend Files

- `frontend/src/pages/CourseList.jsx`
- `frontend/src/pages/CourseDetail.jsx`
- `frontend/src/components/CourseCard.jsx`
- `frontend/src/services/courseService.js`
- `frontend/src/hooks/useCourses.js`
- `frontend/src/utils/courseMeta.js`

### Responsibilities

- Own the entire catalog data model and browsing experience.
- Ensure course-module-lesson hierarchy stays consistent.
- Keep instructor ownership checks correct when content is edited.
- Maintain course categorization helpers and catalog filtering behavior.

### Why This Ownership Makes Sense

This is the content model of the platform. It is a clean vertical slice from storage to UI.

---

## 4.4 Team Member 4: Learner Journey, Enrollment, Progress, and Performance - brajesh & sidhartha

### Primary Scope

- enrollments
- learner progress
- lesson completion
- performance records
- learning session lifecycle
- certificate unlock state

### Main Backend Files

- `backend/routes/enrollment.routes.js`
- `backend/routes/progress.routes.js`
- `backend/routes/performance.routes.js`
- `backend/controllers/EnrollmentController.js`
- `backend/controllers/ProgressController.js`
- `backend/controllers/PerformanceController.js`
- `backend/services/EnrollmentService.js`
- `backend/services/ProgressService.js`
- `backend/services/PerformanceService.js`
- `backend/repositories/EnrollmentRepository.js`
- `backend/repositories/ProgressRepository.js`
- `backend/repositories/PerformanceRepository.js`
- `backend/models/mysql/Enrollment.js`
- `backend/models/mysql/Progress.js`
- `backend/models/mysql/Performance.js`
- `backend/models/mongo/LearningEvent.js`
- `backend/utils/validators/enrollmentValidator.js`
- `backend/utils/validators/progressValidator.js`
- `backend/utils/validators/performanceValidator.js`

### Main Frontend Files

- `frontend/src/pages/EnrolledCourses.jsx`
- `frontend/src/pages/LearningView.jsx`
- `frontend/src/pages/PerformanceView.jsx`
- `frontend/src/services/enrollmentService.js`
- `frontend/src/services/progressService.js`
- `frontend/src/services/performanceService.js`
- `frontend/src/hooks/useProgress.js`
- `frontend/src/components/ProgressBar.jsx`
- `frontend/src/components/CertificateModal.jsx`
- `frontend/src/utils/pdf.js`

### Responsibilities

- Own learner state transitions from enrollment to completion.
- Maintain lesson start and completion rules.
- Ensure course progress percentage is correct.
- Own performance and certificate-related learner outputs.

### Why This Ownership Makes Sense

This is the core learner journey slice and directly maps to the main product outcome.

---

## 4.5 Team Member 5: Instructor Workflows, Quizzes, and Teaching Analytics - shubham

### Primary Scope

- instructor panel
- module quiz creation
- quiz submission data interpretation
- instructor analytics
- teacher-owned content management

### Main Backend Files

- `backend/routes/quiz.routes.js`
- `backend/controllers/QuizController.js`
- `backend/services/ModuleQuizService.js`
- `backend/services/InstructorScopeService.js`
- `backend/models/mongo/ModuleQuiz.js`
- `backend/models/mongo/ActivityLog.js`
- `backend/utils/validators/quizValidator.js`

### Main Frontend Files

- `frontend/src/pages/InstructorPanel.jsx`
- `frontend/src/services/quizService.js`
- `frontend/src/utils/courseMeta.js`

### Responsibilities

- Own quiz authoring and quiz submission flows.
- Own instructor analytics tables and cohort visibility.
- Support instructors in managing teaching content after approval.
- Keep quiz storage and quiz rendering consistent between instructor and learner experiences.

### Why This Ownership Makes Sense

Instructor workflows are complex enough to deserve their own owner, especially with quiz authoring and analytics.

---

## 4.6 Team Member 6: Admin Operations, User Management, and Approval Workflow - subhankar

### Primary Scope

- admin panel
- user management
- approval queue
- instructor signup approval
- course approval lifecycle

### Main Backend Files

- `backend/routes/approval.routes.js`
- `backend/routes/user.routes.js`
- `backend/controllers/ApprovalController.js`
- `backend/controllers/UserController.js`
- `backend/services/ApprovalService.js`
- `backend/services/UserService.js`
- `backend/repositories/UserRepository.js`
- `backend/models/mysql/User.js`
- `backend/models/mongo/ApprovalRequest.js`
- `backend/utils/validators/userValidator.js`

### Main Frontend Files

- `frontend/src/pages/AdminPanel.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/services/approvalService.js`

### Responsibilities

- Own the platform governance layer.
- Maintain approval decision logic.
- Own admin CRUD on users, courses, and enrollments through the admin UI.
- Keep role-change safety rules correct.

### Why This Ownership Makes Sense

The admin workflow is its own operational system, separate from pure content or learner behavior.

---

## 4.7 Team Member 7: Shared Frontend Experience, Design System, Navigation, and UX Consistency - 

### Primary Scope

- app shell layout and route presentation
- navigation
- shared components
- styling system
- reusable UI patterns
- quality of user-facing interactions

### Main Files

- `frontend/src/App.jsx`
- `frontend/src/index.css`
- `frontend/src/context/ToastContext.jsx`
- `frontend/src/hooks/useTheme.js`
- `frontend/src/hooks/useToast.js`
- `frontend/src/hooks/usePageTitle.js`
- `frontend/src/components/BackButton.jsx`
- `frontend/src/components/ConfirmModal.jsx`
- `frontend/src/components/ErrorMessage.jsx`
- `frontend/src/components/Icon.jsx`
- `frontend/src/components/LoadingSpinner.jsx`
- `frontend/src/components/Pagination.jsx`
- `frontend/src/components/Toast.jsx`
- `frontend/src/pages/RoleAccessPage.jsx`
- `frontend/src/pages/NotFound.jsx`
- `frontend/src/utils/helpers.js`

### Responsibilities

- Keep the visual system coherent.
- Own modal behavior, navigation consistency, and shared UI interactions.
- Maintain top-level route presentation and page-wrapper UX, while coordinating with Member 1 on provider or API bootstrap changes.
- Improve UX quality without breaking domain pages.

### Why This Ownership Makes Sense

Without a shared frontend owner, UI logic tends to become fragmented across pages.

---

## 4.8 Suggested Review Pairing

- Member 1 reviews platform, middleware, schema, startup, and shared API bootstrap changes.
- Member 2 reviews auth and access-sensitive changes.
- Member 3 reviews content model changes.
- Member 4 reviews learner-state calculations.
- Member 5 reviews quiz and instructor workflow changes.
- Member 6 reviews admin, user, and approval behavior.
- Member 7 reviews all shared UI and interaction changes.

---

## 5. Recommended Reading Order for New Team Members

If someone is brand new to the codebase, read in this order:

1. `README.md`
2. `backend/app.js`
3. `backend/server.js`
4. `frontend/src/main.jsx`
5. `frontend/src/App.jsx`
6. auth flow files
7. MySQL models and schema
8. Mongo models
9. backend controllers and services by domain
10. frontend pages by user journey
11. shared components and utilities
12. this guide again after first read-through

This order helps people understand:

- how the app starts
- how requests travel
- where data lives
- how roles shape the UI

---

## 6. Backend Deep Dive

## 6.1 Backend Entry Files

### `backend/app.js`

This is the main Express assembly file.

It does the following:

- loads environment variables
- creates the Express app
- enables CORS for the frontend URL
- enables JSON parsing
- enables request logging with Morgan
- initializes Passport
- applies rate limiting
- registers all route groups
- exposes `/health`
- mounts the centralized error handler last

This is the true backend composition root.

### `backend/server.js`

This file handles startup orchestration.

It:

- imports the Express app
- connects MongoDB
- ensures demo local accounts exist
- starts the HTTP server

The important nuance is that the app does not just start Express; it also depends on MongoDB startup and demo account bootstrapping.

---

## 6.2 Backend Configuration Files

### `backend/config/db.mysql.js`

- creates a MySQL connection pool
- reads credentials from environment variables
- verifies connection at startup

### `backend/config/db.mongo.js`

- initializes Mongoose
- caches the connection promise
- enforces `MONGO_URI`
- exports both the mongoose object and `connectMongo()`

### `backend/config/passport.js`

- configures GitHub OAuth with Passport
- creates new MySQL users on first GitHub login
- updates avatar on returning GitHub login

### `backend/config/cache.js`

- small in-memory cache using `node-cache`
- currently used for course and module list caching

### `backend/config/constants.js`

- defines role constants
- exposes cache key names
- exposes JWT expiry fallback

---

## 6.3 Backend Middleware Pipeline

### `backend/middlewares/authenticate.js`

- reads the `Authorization: Bearer <token>` header
- verifies JWT using `JWT_SECRET`
- attaches decoded user payload to `req.user`

### `backend/middlewares/authorize.js`

- checks whether `req.user.role` matches allowed roles

### `backend/middlewares/validate.js`

- validates request body with Joi
- returns all validation errors at once

### `backend/middlewares/logger.js`

- writes request metadata into MongoDB `activity_logs`
- captures user id, route action, params, query, and body
- is applied on many protected route handlers rather than as a single global middleware

This is very useful operationally, but it also means request bodies are being logged.

### `backend/middlewares/rateLimiter.js`

- rate-limits requests in production
- intentionally skips rate limiting in development

### `backend/middlewares/errorHandler.js`

- centralizes error response shape
- standardizes `{ success, data, message, errors }`

---

## 6.4 Backend Route Map

| Route Group | Main Purpose | Key Files |
| --- | --- | --- |
| `/auth` | GitHub login, local login/signup, OTP verification, reset password, demo accounts, current user, logout | `auth.routes.js`, `AuthController.js`, `AuthService.js` |
| `/users` | list/update/delete users | `user.routes.js`, `UserController.js`, `UserService.js` |
| `/courses` | course CRUD and instructor course approval submission | `course.routes.js`, `CourseController.js`, `CourseService.js` |
| `/modules` | module CRUD under a course | `module.routes.js`, `ModuleController.js`, `ModuleService.js` |
| `/lessons` | lesson CRUD under a module | `lesson.routes.js`, `LessonController.js`, `LessonService.js` |
| `/enrollments` | learner enrollment records | `enrollment.routes.js`, `EnrollmentController.js`, `EnrollmentService.js` |
| `/progress` | progress CRUD plus lesson start and completion | `progress.routes.js`, `ProgressController.js`, `ProgressService.js` |
| `/performance` | score records | `performance.routes.js`, `PerformanceController.js`, `PerformanceService.js` |
| `/approvals` | approval list and review actions | `approval.routes.js`, `ApprovalController.js`, `ApprovalService.js` |
| `/quizzes` | module quiz definitions and learner submissions | `quiz.routes.js`, `QuizController.js`, `ModuleQuizService.js` |

---

## 6.5 Authentication Domain

### What It Does

The auth domain supports:

- GitHub OAuth
- local email/password login
- local signup
- signup OTP verification
- forgot-password OTP verification
- demo local accounts
- profile retrieval
- logout event logging

### Key Files

- `backend/routes/auth.routes.js`
- `backend/controllers/AuthController.js`
- `backend/services/AuthService.js`
- `backend/services/OtpService.js`
- `backend/services/EmailService.js`
- `backend/services/BootstrapService.js`
- `backend/config/passport.js`

### Current Logic Notes

- GitHub login creates or updates users in MySQL.
- Local signup creates OTP state in MongoDB first.
- Instructor local signup does not immediately create an active instructor user; it creates a pending credential and approval request.
- Local login currently returns a token directly for valid email/password.
- Forgot password still uses OTP.
- Demo accounts are ensured automatically on backend startup.

### Important Nuance

The codebase still contains `/auth/login/verify`, but the current frontend login flow no longer requires OTP for normal login. This is a maintenance note the auth owner should track.

---

## 6.6 User Domain

### What It Does

- list users
- get user by id
- update user
- delete user

### Role Rules

- admins can manage users
- instructors can list users
- admins cannot edit or delete themselves from the admin panel

### Key Files

- `backend/routes/user.routes.js`
- `backend/controllers/UserController.js`
- `backend/services/UserService.js`
- `backend/repositories/UserRepository.js`
- `backend/models/mysql/User.js`

---

## 6.7 Course, Module, and Lesson Domain

### What It Does

This is the content hierarchy:

- a course belongs to one instructor
- a course has many modules
- a module has many lessons

### Key Service Responsibilities

#### `CourseService`

- caches course lists
- retrieves single course with modules and lessons
- creates, updates, patches, and deletes courses

#### `ModuleService`

- caches module list
- retrieves module with lessons

#### `LessonService`

- performs lesson CRUD

#### `InstructorScopeService`

- ensures instructors only manage their own courses, modules, and lessons

### Approval Behavior

Instructors do not always apply course changes directly:

- course create/update/delete becomes an approval request for admins

Modules and lessons, however, are directly modified after ownership checks.

### Key Files

- `backend/controllers/CourseController.js`
- `backend/controllers/ModuleController.js`
- `backend/controllers/LessonController.js`
- `backend/services/CourseService.js`
- `backend/services/ModuleService.js`
- `backend/services/LessonService.js`
- `backend/services/InstructorScopeService.js`

---

## 6.8 Enrollment Domain

### What It Does

- enroll learners into courses
- view enrollment records
- update enrollment status
- allow learners to leave active courses

### Business Rules

- instructors cannot enroll in courses
- learners can only enroll themselves
- only learners can be enrolled
- completed courses cannot be left

### Key Files

- `backend/routes/enrollment.routes.js`
- `backend/controllers/EnrollmentController.js`
- `backend/services/EnrollmentService.js`
- `backend/models/mysql/Enrollment.js`

---

## 6.9 Progress Domain

### What It Does

- stores overall course completion percentage
- tracks lesson start events
- tracks lesson completion events
- calculates completion percentage
- updates enrollment status when course reaches 100%

### Core Logic

The most important logic in the backend lives in `ProgressService.completeLesson()`:

- verify lesson exists
- verify learner started the lesson first
- estimate minimum required reading time from lesson content
- reject too-fast completion attempts
- log completion event
- recompute progress across all lessons in the course
- patch progress record
- patch enrollment record status

### Why It Matters

This file is the center of learning-state integrity.

### Key Files

- `backend/services/ProgressService.js`
- `backend/controllers/ProgressController.js`
- `backend/models/mysql/Progress.js`
- `backend/models/mongo/LearningEvent.js`

---

## 6.10 Performance Domain

### What It Does

- stores numeric score records by learner and course
- supports learner-only filtered viewing on the frontend

### Key Files

- `backend/routes/performance.routes.js`
- `backend/controllers/PerformanceController.js`
- `backend/services/PerformanceService.js`
- `backend/models/mysql/Performance.js`

---

## 6.11 Approval Domain

### What It Does

Approval requests are stored in MongoDB and reviewed by admins.

Current approval types:

- instructor signup
- course
- module
- lesson

Current actions:

- create
- update
- delete

### Core Logic

`ApprovalService.approve()`:

- loads the approval request
- rejects already-reviewed requests
- branches by request type
- applies the requested action
- marks request as approved

`ApprovalService.reject()`:

- marks request rejected
- optionally disables pending instructor credentials

### Why It Matters

This service is the governance layer of the platform.

### Key Files

- `backend/routes/approval.routes.js`
- `backend/controllers/ApprovalController.js`
- `backend/services/ApprovalService.js`
- `backend/models/mongo/ApprovalRequest.js`

---

## 6.12 Quiz Domain

### What It Does

- instructors create quizzes per module
- learners submit answers
- submission history is stored in Mongo activity logs
- instructor analytics surfaces latest module quiz scores

### Data Split

- quiz definitions live in Mongo `module_quizzes`
- quiz submission records live in Mongo `activity_logs`

### Key Files

- `backend/routes/quiz.routes.js`
- `backend/controllers/QuizController.js`
- `backend/services/ModuleQuizService.js`
- `backend/models/mongo/ModuleQuiz.js`
- `backend/models/mongo/ActivityLog.js`

---

## 6.13 Logging and Observability

### Mongo Collections Used as Logs

- `activity_logs`
- `auth_logs`
- `learning_events`

### Sources of Logged Data

- request logger middleware
- auth success/failure logging
- logout logging
- quiz submission logging
- lesson start and complete events

This is useful for analytics and debugging, but it also means Mongo is both a workflow store and a telemetry store.

---

## 7. Database Design

## 7.1 MySQL Tables

### `users`

- canonical relational user record
- contains role and optional GitHub identity

### `courses`

- top-level learning units
- tied to `instructor_id`

### `modules`

- second-level content grouping under courses
- ordered with `sequence_order`

### `lessons`

- leaf content nodes
- stores lesson text content

### `enrollments`

- learner-course relationship
- tracks `active` or `completed`

### `progress`

- summary record for learner completion percentage per course

### `performance`

- score records for assessments

---

## 7.2 Mongo Collections

### `local_credentials`

- local auth identities
- password hash
- status such as active, pending, disabled

### `email_otps`

- temporary OTP state
- hashed codes
- purpose-based records with expiration

### `approval_requests`

- pending admin-review work items

### `module_quizzes`

- quiz definitions per module

### `activity_logs`

- general operational log stream

### `auth_logs`

- login success/failure history

### `learning_events`

- lesson start and completion events

---

## 8. Frontend Deep Dive

## 8.1 Frontend Boot Files

### `frontend/src/main.jsx`

This is the frontend boot file.

It wraps the app with:

- `ThemeProvider`
- `ToastProvider`
- `AuthProvider`

### `frontend/src/App.jsx`

This is the frontend route composition file.

It:

- defines routes
- adds `Navbar`
- adds `BackButton`
- wraps protected pages with `ProtectedRoute`
- scrolls to top on route change

---

## 8.2 Frontend Routing Map

| Route | Purpose |
| --- | --- |
| `/login` | login, signup, OTP verification, reset password |
| `/auth/callback` | GitHub OAuth callback token handling |
| `/dashboard` | role-aware dashboard |
| `/access` | role explanation page |
| `/courses` | catalog browser |
| `/courses/:id` | detailed course view |
| `/my-courses` | learner-only enrolled courses page |
| `/learn/:courseId` | learner-only lesson consumption flow |
| `/performance` | learner-only score history |
| `/profile` | profile editing |
| `/admin` | admin-only operations panel |
| `/instructor` | instructor-only management panel |
| `*` | not found page |

---

## 8.3 Shared Frontend Infrastructure

### `frontend/src/services/api.js`

This is the shared Axios client.

It:

- sets base URL from `VITE_API_URL`
- injects bearer token from localStorage
- auto-redirects to `/login` on `401`

This file is critical because every domain service depends on it.

### Domain Service Files

- `authService.js`
- `courseService.js`
- `enrollmentService.js`
- `progressService.js`
- `performanceService.js`
- `approvalService.js`
- `quizService.js`

These are thin wrappers around backend endpoints.

### Shared Hooks

- `useAuth.js`: user state, login, logout, `getMe()` bootstrap
- `useCourses.js`: course fetch helper
- `useProgress.js`: progress fetch helper
- `useTheme.js`: theme persistence
- `useToast.js`: toast context access
- `usePageTitle.js`: per-page document title

### Shared Components

- `Navbar.jsx`
- `ProtectedRoute.jsx`
- `BackButton.jsx`
- `Toast.jsx`
- `ConfirmModal.jsx`
- `LoadingSpinner.jsx`
- `Pagination.jsx`
- `ProgressBar.jsx`
- `ErrorMessage.jsx`
- `CourseCard.jsx`
- `CertificateModal.jsx`
- `Icon.jsx`

---

## 8.4 Login and Identity Screens

### `frontend/src/pages/Login.jsx`

This page is more than just login. It handles:

- local login
- local signup
- signup OTP verification
- forgot-password email submission
- password reset
- GitHub OAuth launch
- demo account visibility

### Current UX Behavior

- correct email/password logs in directly
- new local signup requires OTP verification
- instructor signup requires admin approval after signup verification
- forgot password requires OTP
- GitHub OAuth still exists

### Supporting Files

- `AuthCallback.jsx`
- `useAuth.js`
- `authService.js`
- `ProtectedRoute.jsx`

---

## 8.5 Dashboard

### `frontend/src/pages/Dashboard.jsx`

This page builds different dashboard models for three roles:

- learner
- instructor
- admin

It aggregates backend data from:

- courses
- enrollments
- progress
- performance

Then it generates:

- spotlight copy
- role-specific quick actions
- stat cards
- operational signals

This is not just a static dashboard; it is a role-aware summary composer.

---

## 8.6 Course Discovery Pages

### `frontend/src/pages/CourseList.jsx`

This page supports:

- course search
- category filtering
- learner view filtering
- enrollment action
- pagination
- split presentation of enrolled and open courses for learners

It also uses `useDeferredValue()` for smoother search behavior.

### `frontend/src/pages/CourseDetail.jsx`

This page supports:

- detailed course view
- module and lesson preview
- learner enrollment
- recommended embedded videos
- course PDF download

### Supporting Files

- `CourseCard.jsx`
- `courseMeta.js`
- `pdf.js`

---

## 8.7 Learner Experience Pages

### `frontend/src/pages/EnrolledCourses.jsx`

This page shows:

- learner enrollments
- progress per course
- leave-course action
- certificate access for completed courses

### `frontend/src/pages/LearningView.jsx`

This is one of the most important frontend pages.

It handles:

- loading a course and setting the first lesson active
- starting a lesson session when learner opens a lesson
- marking a lesson complete
- gating progress until the learner spends enough time
- controlling next-lesson navigation
- showing embedded recommended videos
- revealing module quiz after lesson completion
- certificate download once the course is complete

This page is effectively the learner runtime.

### `frontend/src/pages/PerformanceView.jsx`

This shows:

- score history
- average score
- paginated performance records

---

## 8.8 Instructor Experience

### `frontend/src/pages/InstructorPanel.jsx`

This page is the instructor operating center.

It supports:

- viewing owned courses
- submitting new course requests
- editing approved courses
- adding and editing modules
- adding and editing lessons
- creating, editing, and deleting quizzes
- viewing approval request history
- viewing learner progress and quiz performance per course

This page combines several backend domains:

- courses
- approvals
- enrollments
- progress
- quizzes

---

## 8.9 Admin Experience

### `frontend/src/pages/AdminPanel.jsx`

This page supports:

- user management
- course management
- enrollment management
- approval queue review
- create/edit/delete forms
- approve/reject actions
- search and pagination

This is the main governance interface.

---

## 8.10 Profile and Supporting Pages

### `frontend/src/pages/Profile.jsx`

- allows current user to edit name and email
- admins are intentionally blocked from self-edit in this UI

### `frontend/src/pages/RoleAccessPage.jsx`

- explains the difference between learner, instructor, and admin roles

### `frontend/src/pages/NotFound.jsx`

- fallback route for unknown URLs

---

## 8.11 Shared UI Utilities

### `frontend/src/utils/courseMeta.js`

This file does three things:

- infers course category from keywords
- provides fallback sample videos
- builds fallback quizzes when real quiz data does not exist

### `frontend/src/utils/pdf.js`

This file has two PDF strategies:

- direct blob-based plain PDF generation for course and module overviews
- HTML-based print/download flow for certificates

### `frontend/src/utils/helpers.js`

- date formatting
- percentage formatting
- initials generation
- role color helpers

### `frontend/src/index.css`

This is the single large global stylesheet for the entire app.

It owns:

- navbar
- cards
- forms
- modals
- page layouts
- dashboards
- course catalog
- learning view
- instructor/admin visuals
- toast system

This file is effectively the design system implementation.

---

## 9. Important End-to-End Workflows

## 9.1 GitHub OAuth Login

1. user clicks GitHub login in `Login.jsx`
2. browser is redirected to `/auth/github`
3. Passport GitHub strategy authenticates user
4. backend creates or updates MySQL `users` record
5. backend generates JWT
6. backend redirects to frontend callback
7. `AuthCallback.jsx` stores token through `useAuth`
8. frontend redirects to dashboard

## 9.2 Local Signup

1. user submits name, email, password, and role
2. backend `AuthService.signup()` creates OTP record
3. OTP is emailed or logged to console in dev
4. frontend shows signup OTP screen
5. backend verifies OTP
6. learner path:
   - creates MySQL user
   - creates Mongo local credential
   - returns token
7. instructor path:
   - creates pending Mongo local credential
   - creates approval request
   - waits for admin approval

## 9.3 Local Login

1. user submits email/password
2. backend validates local credential
3. backend returns token directly
4. frontend stores token via `useAuth`
5. frontend redirects to dashboard

## 9.4 Forgot Password

1. user submits email
2. backend issues OTP for `reset`
3. user enters OTP and new password
4. backend verifies OTP and updates password hash

## 9.5 Course Enrollment

1. learner clicks enroll in catalog or course detail page
2. frontend calls `/enrollments`
3. backend verifies target user is a learner
4. backend creates enrollment row in MySQL
5. frontend updates local enrolled state

## 9.6 Lesson Progression

1. learner opens a lesson in `LearningView`
2. frontend calls `startLessonSession`
3. backend writes `learning_events` start record
4. learner later clicks mark complete
5. backend verifies enough time has elapsed
6. backend writes completion event
7. backend recalculates course progress
8. frontend updates progress bar and completed lessons set

## 9.7 Instructor Course Approval

1. instructor submits course create/update/delete
2. backend creates approval request instead of direct write
3. admin sees request in `AdminPanel`
4. admin approves or rejects
5. approval service applies requested operation if approved

## 9.8 Quiz Authoring and Submission

1. instructor opens quiz modal in `InstructorPanel`
2. instructor saves quiz to `module_quizzes`
3. learner completes module lessons
4. learner sees quiz in `LearningView`
5. learner submits answers
6. backend stores submission in `activity_logs`
7. instructor analytics shows latest per-learner per-module scores

## 9.9 Certificate Download

1. learner reaches full course completion
2. frontend unlocks certificate button
3. `pdf.js` generates printable certificate content

---

## 10. Key Risks and Maintenance Notes

### 10.1 README Is Partially Outdated

The root `README.md` says the project uses GitHub login only.

The current codebase now also supports:

- local login
- local signup
- signup OTP
- forgot-password OTP
- demo local accounts

### 10.2 No Formal Automated Test Suite

There are scripts for:

- backend dev
- backend start
- backend seed
- frontend dev
- frontend build
- frontend preview
- frontend lint

But there is no dedicated automated unit or integration test suite in the repository right now.

### 10.3 Repo-Wide Lint Issues Exist

The frontend has ESLint configured, but the repository currently contains lint issues outside any single recent change set. That should be treated as a cleanup track, not as one person silently owning the whole problem.

### 10.4 Hybrid Data Model Means Dual Debugging

A single feature may touch:

- MySQL for primary business data
- MongoDB for approvals, local credentials, quizzes, or logs

Developers must always ask:

- is this feature relational data?
- is this feature workflow or event data?

### 10.5 Logger Middleware Stores Request Metadata

Because request body and params are logged, future sensitive fields should be handled carefully.

### 10.6 Some Pages Call `api` Directly Instead of Always Using Service Wrappers

Examples include admin and instructor pages.

That is not wrong, but it means the service layer is not perfectly uniform. Future refactoring could centralize more API calls.

---

## 11. Suggested Team Working Model

### Daily Workflow

1. Each owner updates only their slice first.
2. Cross-cutting changes require notifying affected owners.
3. Member 1 verifies startup, middleware, schema, shared API bootstrap, and integration impact.
4. Member 7 verifies shared UI and route-shell UX impact.
5. Member 2 verifies auth and role impact whenever routes or protection logic change.

### Branch Strategy Suggestion

- one feature branch per member
- one integration branch for merged team work
- avoid editing another member's core files without telling them first

### Merge Priority

1. schema and config changes
2. auth changes
3. backend domain changes
4. frontend domain pages
5. global CSS and shared UI

---

## 12. File-by-File Reference Inventory

This section is intentionally detailed so teammates can quickly identify where to read and where to edit.

## 12.1 Backend Root and Config

- `backend/.env`: runtime environment values for ports, DBs, JWT, GitHub OAuth, SMTP, and rate limiting.
- `backend/app.js`: Express app composition and route registration.
- `backend/server.js`: startup sequence.
- `backend/schema.sql`: MySQL schema plus starter sample data.
- `backend/scripts/seedSampleData.js`: large demo content generator for realistic local data.
- `backend/config/db.mysql.js`: MySQL pool.
- `backend/config/db.mongo.js`: Mongo connection management.
- `backend/config/passport.js`: GitHub strategy.
- `backend/config/cache.js`: node-cache instance.
- `backend/config/constants.js`: shared constants.
- `backend/package.json`: backend scripts and dependencies.

## 12.2 Backend Routes

- `backend/routes/auth.routes.js`: auth endpoints.
- `backend/routes/user.routes.js`: user endpoints.
- `backend/routes/course.routes.js`: course endpoints.
- `backend/routes/module.routes.js`: module endpoints.
- `backend/routes/lesson.routes.js`: lesson endpoints.
- `backend/routes/enrollment.routes.js`: enrollment endpoints.
- `backend/routes/progress.routes.js`: progress and lesson-session endpoints.
- `backend/routes/performance.routes.js`: performance endpoints.
- `backend/routes/approval.routes.js`: approval review endpoints.
- `backend/routes/quiz.routes.js`: quiz endpoints.

## 12.3 Backend Controllers

- `backend/controllers/AuthController.js`: auth HTTP handlers.
- `backend/controllers/UserController.js`: user HTTP handlers.
- `backend/controllers/CourseController.js`: course HTTP handlers and approval submission logic.
- `backend/controllers/ModuleController.js`: module HTTP handlers.
- `backend/controllers/LessonController.js`: lesson HTTP handlers.
- `backend/controllers/EnrollmentController.js`: enrollment permission and creation logic.
- `backend/controllers/ProgressController.js`: progress CRUD plus lesson start and completion actions.
- `backend/controllers/PerformanceController.js`: score CRUD handlers.
- `backend/controllers/ApprovalController.js`: admin approval handlers.
- `backend/controllers/QuizController.js`: quiz definition and quiz submission handlers.

## 12.4 Backend Services

- `backend/services/AuthService.js`: core auth business logic.
- `backend/services/OtpService.js`: OTP issue and verification logic.
- `backend/services/EmailService.js`: SMTP or console fallback email sender.
- `backend/services/BootstrapService.js`: demo local accounts.
- `backend/services/UserService.js`: user service wrapper.
- `backend/services/CourseService.js`: course list caching and CRUD.
- `backend/services/ModuleService.js`: module list caching and CRUD.
- `backend/services/LessonService.js`: lesson CRUD.
- `backend/services/EnrollmentService.js`: duplicate-enrollment protection and CRUD.
- `backend/services/ProgressService.js`: progress calculation and lesson-state logic.
- `backend/services/PerformanceService.js`: score CRUD.
- `backend/services/ApprovalService.js`: approval engine.
- `backend/services/ModuleQuizService.js`: quiz definition persistence.
- `backend/services/InstructorScopeService.js`: instructor ownership checks.
- `backend/services/LogService.js`: Mongo log write helpers.

## 12.5 Backend Repositories

- `backend/repositories/UserRepository.js`: delegates to MySQL user model.
- `backend/repositories/CourseRepository.js`: delegates to MySQL course model.
- `backend/repositories/ModuleRepository.js`: delegates to MySQL module model.
- `backend/repositories/LessonRepository.js`: delegates to MySQL lesson model.
- `backend/repositories/EnrollmentRepository.js`: delegates to MySQL enrollment model.
- `backend/repositories/ProgressRepository.js`: delegates to MySQL progress model.
- `backend/repositories/PerformanceRepository.js`: delegates to MySQL performance model.

## 12.6 Backend MySQL Models

- `backend/models/mysql/User.js`: SQL for user CRUD.
- `backend/models/mysql/Course.js`: SQL for course CRUD and nested course read.
- `backend/models/mysql/Module.js`: SQL for module CRUD.
- `backend/models/mysql/Lesson.js`: SQL for lesson CRUD.
- `backend/models/mysql/Enrollment.js`: SQL for enrollment CRUD.
- `backend/models/mysql/Progress.js`: SQL for progress CRUD.
- `backend/models/mysql/Performance.js`: SQL for performance CRUD.

## 12.7 Backend Mongo Models

- `backend/models/mongo/LocalCredential.js`: local account identity store.
- `backend/models/mongo/EmailOtp.js`: OTP storage with TTL.
- `backend/models/mongo/ApprovalRequest.js`: approval queue.
- `backend/models/mongo/ModuleQuiz.js`: quiz definitions.
- `backend/models/mongo/ActivityLog.js`: request and submission logs.
- `backend/models/mongo/AuthLog.js`: auth audit events.
- `backend/models/mongo/LearningEvent.js`: lesson session events.

## 12.8 Backend Middleware

- `backend/middlewares/authenticate.js`: JWT verification.
- `backend/middlewares/authorize.js`: role check.
- `backend/middlewares/validate.js`: Joi body validation.
- `backend/middlewares/logger.js`: activity logging.
- `backend/middlewares/rateLimiter.js`: request throttling.
- `backend/middlewares/errorHandler.js`: final error serializer.

## 12.9 Backend Utils and Validators

- `backend/utils/jwt.js`: token generation and verification.
- `backend/utils/response.js`: standardized success and error response helpers.
- `backend/utils/validators/authValidator.js`: auth Joi schemas.
- `backend/utils/validators/userValidator.js`: user Joi schemas.
- `backend/utils/validators/courseValidator.js`: course Joi schemas.
- `backend/utils/validators/moduleValidator.js`: module Joi schemas.
- `backend/utils/validators/lessonValidator.js`: lesson Joi schemas.
- `backend/utils/validators/enrollmentValidator.js`: enrollment Joi schemas.
- `backend/utils/validators/progressValidator.js`: progress Joi schemas.
- `backend/utils/validators/performanceValidator.js`: performance Joi schemas.
- `backend/utils/validators/quizValidator.js`: quiz Joi schemas.

## 12.10 Frontend Root and Tooling

- `frontend/package.json`: frontend scripts and dependencies.
- `frontend/vite.config.js`: Vite config.
- `frontend/eslint.config.js`: lint rules.
- `frontend/index.html`: app mounting HTML.
- `frontend/src/main.jsx`: provider composition.
- `frontend/src/App.jsx`: route composition.
- `frontend/src/index.css`: global styling system.

## 12.11 Frontend Context and Hooks

- `frontend/src/context/ToastContext.jsx`: toast storage and dispatch.
- `frontend/src/hooks/useAuth.js`: auth context hook and provider.
- `frontend/src/hooks/useCourses.js`: course data loader hook.
- `frontend/src/hooks/useProgress.js`: progress data loader hook.
- `frontend/src/hooks/useTheme.js`: theme state and persistence.
- `frontend/src/hooks/useToast.js`: toast consumer hook.
- `frontend/src/hooks/usePageTitle.js`: document title helper.

## 12.12 Frontend Services

- `frontend/src/services/api.js`: shared Axios instance.
- `frontend/src/services/authService.js`: auth calls.
- `frontend/src/services/courseService.js`: course calls.
- `frontend/src/services/enrollmentService.js`: enrollment calls.
- `frontend/src/services/progressService.js`: progress calls.
- `frontend/src/services/performanceService.js`: performance calls.
- `frontend/src/services/approvalService.js`: approval calls.
- `frontend/src/services/quizService.js`: quiz calls.

## 12.13 Frontend Shared Components

- `frontend/src/components/Navbar.jsx`: top navigation and logout confirmation.
- `frontend/src/components/ProtectedRoute.jsx`: auth gate.
- `frontend/src/components/BackButton.jsx`: floating back action.
- `frontend/src/components/ConfirmModal.jsx`: reusable confirm dialog.
- `frontend/src/components/Toast.jsx`: toast renderer.
- `frontend/src/components/LoadingSpinner.jsx`: loading state UI.
- `frontend/src/components/Pagination.jsx`: pagination control.
- `frontend/src/components/ProgressBar.jsx`: progress visualization.
- `frontend/src/components/ErrorMessage.jsx`: error display block.
- `frontend/src/components/Icon.jsx`: shared SVG icon set.
- `frontend/src/components/CourseCard.jsx`: catalog course card.
- `frontend/src/components/CertificateModal.jsx`: certificate preview modal.

## 12.14 Frontend Pages

- `frontend/src/pages/Login.jsx`: auth flows.
- `frontend/src/pages/AuthCallback.jsx`: OAuth callback handler.
- `frontend/src/pages/Dashboard.jsx`: role-aware summary dashboard.
- `frontend/src/pages/CourseList.jsx`: course catalog.
- `frontend/src/pages/CourseDetail.jsx`: detailed course landing page.
- `frontend/src/pages/EnrolledCourses.jsx`: learner enrollments.
- `frontend/src/pages/LearningView.jsx`: lesson runtime and quizzes.
- `frontend/src/pages/PerformanceView.jsx`: learner score history.
- `frontend/src/pages/Profile.jsx`: profile editor.
- `frontend/src/pages/AdminPanel.jsx`: admin operations.
- `frontend/src/pages/InstructorPanel.jsx`: instructor operations and analytics.
- `frontend/src/pages/RoleAccessPage.jsx`: role overview.
- `frontend/src/pages/NotFound.jsx`: fallback route.

## 12.15 Frontend Utilities and Static Assets

- `frontend/src/utils/constants.js`: shared frontend constants.
- `frontend/src/utils/helpers.js`: helper formatters.
- `frontend/src/utils/courseMeta.js`: course categorization, sample videos, fallback quizzes.
- `frontend/src/utils/pdf.js`: download utilities.
- `frontend/public/icons.svg`: SVG sprite/static icon asset.
- `frontend/public/favicon.svg`: favicon.
- `frontend/src/assets/hero.png`: image asset.

---

## 13. Final Recommendation

If the team wants the project to stay maintainable, do not treat it as one undivided code dump. Treat it as 7 coordinated slices:

- platform and integration
- auth
- content
- learner state
- instructor tools
- admin workflows
- shared frontend UX

That split matches how the code is already shaped and will reduce merge conflicts, ownership confusion, and onboarding time.

---

## 14. Quick Reference Summary

- Start reading with `backend/app.js` and `frontend/src/App.jsx`.
- Remember that MySQL and MongoDB each own different parts of the product.
- Auth and approvals are not simple; read those carefully before editing.
- `LearningView.jsx` and `ProgressService.js` are the core learner flow files.
- `InstructorPanel.jsx` and `AdminPanel.jsx` are the core operations pages.
- `index.css` is global and affects almost everything.

This document should be updated whenever:

- routes are added
- ownership changes
- database responsibilities change
- auth behavior changes
- new major pages are introduced
