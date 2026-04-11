import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import useToast from '../hooks/useToast';
import { usePageTitle } from '../hooks/usePageTitle';
import { getApprovals } from '../services/approvalService';
import { getInstructorCourseFeedback } from '../services/courseFeedbackService';
import { deleteModuleQuiz, getCourseQuizzes, getQuizSubmissions, upsertModuleQuiz } from '../services/quizService';

const MIN_QUIZ_OPTIONS = 2;

function normalizeQuizOptions(options = []) {
  const nextOptions = Array.isArray(options)
    ? options.map((option) => String(option ?? ''))
    : [];

  while (nextOptions.length < MIN_QUIZ_OPTIONS) {
    nextOptions.push('');
  }

  return nextOptions;
}

export default function InstructorPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [moduleModal, setModuleModal] = useState(null);
  const [lessonModal, setLessonModal] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [courseFeedback, setCourseFeedback] = useState([]);
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [quizModal, setQuizModal] = useState(null);
  const [quizDraft, setQuizDraft] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [collapsedCourses, setCollapsedCourses] = useState({});
  const [collapsedModules, setCollapsedModules] = useState({});
  const toggleCourse = (id) => setCollapsedCourses((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleModule = (id) => setCollapsedModules((prev) => ({ ...prev, [id]: !prev[id] }));

  usePageTitle('Instructor Panel');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [coursesRes, approvalsRes, enrollRes, progressRes, feedbackRes] = await Promise.all([
        api.get('/courses'),
        getApprovals().catch(() => ({ data: { data: [] } })),
        api.get('/enrollments').catch(() => ({ data: { data: [] } })),
        api.get('/progress').catch(() => ({ data: { data: [] } })),
        getInstructorCourseFeedback().catch(() => ({ data: { data: [] } }))
      ]);

      const allCourses = coursesRes.data.data || [];
      const mine = allCourses.filter((course) => course.instructor_id === user?.id);
      const detailedCourses = await Promise.all(
        mine.map((course) =>
          api.get(`/courses/${course.id}`)
            .then((res) => res.data.data)
            .catch(() => course)
        )
      );

      setCourses(detailedCourses);
      setEnrollments(enrollRes.data.data || []);
      setProgressRecords(progressRes.data.data || []);
      setCourseFeedback(feedbackRes.data.data || []);

      const approvalData = (approvalsRes.data.data || [])
        .filter((request) => request.request_type === 'course')
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setApprovals(approvalData);

      const courseIds = detailedCourses.map((course) => course.id);
      if (courseIds.length) {
        const quizResponses = await Promise.all(
          courseIds.map((courseId) => getCourseQuizzes(courseId).catch(() => ({ data: { data: [] } })))
        );
        const submissionResponses = await Promise.all(
          courseIds.map((courseId) => getQuizSubmissions(courseId).catch(() => ({ data: { data: [] } })))
        );

        const quizMap = {};
        quizResponses.forEach((response) => {
          (response.data.data || []).forEach((quiz) => {
            quizMap[quiz.module_id] = quiz;
          });
        });
        setModuleQuizzes(quizMap);

        const submissions = submissionResponses.flatMap((response) => response.data.data || []);
        setQuizSubmissions(submissions);
      } else {
        setModuleQuizzes({});
        setQuizSubmissions([]);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    fetchCourses();
  }, [user]);

  const handleSaveCourse = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target));
    formData.instructor_id = user.id;

    try {
      const res = editModal?.id
        ? await api.patch(`/courses/${editModal.id}`, formData)
        : await api.post('/courses', formData);
      showToast(res.data.message || 'Course request submitted', 'success');
      setEditModal(null);
      fetchCourses();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
  };

  const handleSaveModule = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target));
    formData.course_id = moduleModal.courseId;
    formData.sequence_order = parseInt(formData.sequence_order, 10);

    try {
      const res = moduleModal.id
        ? await api.patch(`/modules/${moduleModal.id}`, formData)
        : await api.post('/modules', formData);
      showToast(res.data.message || 'Module saved', 'success');
      setModuleModal(null);
      fetchCourses();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
  };

  const handleSaveLesson = async (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(event.target));
    formData.module_id = lessonModal.moduleId;

    try {
      const res = lessonModal.id
        ? await api.patch(`/lessons/${lessonModal.id}`, formData)
        : await api.post('/lessons', formData);
      showToast(res.data.message || 'Lesson saved', 'success');
      setLessonModal(null);
      fetchCourses();
    } catch (err) { showToast(err.response?.data?.message || 'Save failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!confirmTarget) return;
    try {
      const res = await api.delete(`/${confirmTarget.type}/${confirmTarget.id}`);
      showToast(res.data.message || 'Deleted', 'success');
      setConfirmTarget(null);
      fetchCourses();
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
      setConfirmTarget(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  const getApprovalTitle = (request) => {
    const actionLabel = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete'
    }[request.action] || 'Review';

    const typeLabel = {
      course: 'Course',
      module: 'Module',
      lesson: 'Lesson'
    }[request.request_type] || 'Request';

    return `${actionLabel} ${typeLabel}`;
  };

  const getApprovalSummary = (request) => {
    if (request.request_type === 'course') {
      return request.payload?.title || 'Course request submitted';
    }
    if (request.request_type === 'module') {
      return request.payload?.module_name || 'Module request submitted';
    }
    if (request.request_type === 'lesson') {
      return request.payload?.lesson_name || 'Lesson request submitted';
    }
    return 'Content request submitted';
  };

  const getApprovalMeta = (request) => {
    const createdAt = request.created_at ? new Date(request.created_at).toLocaleString() : '';
    const entity = request.entity_id ? `Entity ${String(request.entity_id)}` : 'New';
    return `${entity}${createdAt ? ` • ${createdAt}` : ''}`;
  };

  const createEmptyQuestion = (index) => ({
    id: `q-${Date.now()}-${index}`,
    prompt: '',
    options: normalizeQuizOptions(),
    answer: ''
  });

  const openQuizModal = (moduleItem) => {
    const existingQuiz = moduleQuizzes[moduleItem.id];
    const initialQuestions = existingQuiz?.questions?.length
      ? existingQuiz.questions
      : [createEmptyQuestion(0)];
    setQuizDraft({
      title: existingQuiz?.title || `${moduleItem.module_name} Quiz`,
      questions: initialQuestions.map((question, index) => ({
        id: question.id || `q-${moduleItem.id}-${index}`,
        prompt: question.prompt || '',
        options: normalizeQuizOptions(question.options),
        answer: question.answer || ''
      }))
    });
    setQuizModal({ moduleId: moduleItem.id, moduleName: moduleItem.module_name });
  };

  const updateQuizField = (field, value) => {
    setQuizDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const updateQuizQuestion = (index, field, value) => {
    setQuizDraft((current) => {
      const questions = current.questions.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        return { ...question, [field]: value };
      });
      return { ...current, questions };
    });
  };

  const updateQuizOption = (questionIndex, optionIndex, value) => {
    setQuizDraft((current) => {
      const questions = current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex) return question;

        const previousOption = question.options[optionIndex];
        const options = question.options.map((option, currentOptionIndex) => (
          currentOptionIndex === optionIndex ? value : option
        ));

        return {
          ...question,
          options,
          answer: question.answer === previousOption ? value : question.answer
        };
      });

      return { ...current, questions };
    });
  };

  const addQuizOption = (questionIndex) => {
    setQuizDraft((current) => {
      const questions = current.questions.map((question, currentQuestionIndex) => (
        currentQuestionIndex === questionIndex
          ? { ...question, options: [...question.options, ''] }
          : question
      ));

      return { ...current, questions };
    });
  };

  const removeQuizOption = (questionIndex, optionIndex) => {
    setQuizDraft((current) => {
      const questions = current.questions.map((question, currentQuestionIndex) => {
        if (currentQuestionIndex !== questionIndex || question.options.length <= MIN_QUIZ_OPTIONS) {
          return question;
        }

        const removedOption = question.options[optionIndex];
        const options = question.options.filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex);

        return {
          ...question,
          options,
          answer: question.answer === removedOption ? '' : question.answer
        };
      });

      return { ...current, questions };
    });
  };

  const addQuizQuestion = () => {
    setQuizDraft((current) => ({
      ...current,
      questions: [...current.questions, createEmptyQuestion(current.questions.length)]
    }));
  };

  const removeQuizQuestion = (index) => {
    setQuizDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index)
    }));
  };

  const handleSaveQuiz = async (event) => {
    event.preventDefault();
    if (!quizModal || !quizDraft) return;

    const normalizedQuestions = quizDraft.questions.map((question, index) => ({
      id: question.id || `${quizModal.moduleId}-q${index + 1}`,
      prompt: question.prompt.trim(),
      options: (question.options || []).map((option) => option.trim()).filter(Boolean),
      answer: question.answer.trim()
    }));

    const invalidQuestion = normalizedQuestions.find((question) =>
      !question.prompt || question.options.length < 2 || !question.answer
    );
    if (invalidQuestion) {
      showToast('Each quiz question needs a prompt, at least two options, and a correct answer.', 'error');
      return;
    }

    const invalidAnswer = normalizedQuestions.find((question) =>
      !question.options.includes(question.answer)
    );
    if (invalidAnswer) {
      showToast('Each correct answer must match one of the options.', 'error');
      return;
    }

    const duplicateOptionQuestion = normalizedQuestions.find((question) =>
      new Set(question.options.map((option) => option.toLowerCase())).size !== question.options.length
    );
    if (duplicateOptionQuestion) {
      showToast('Options within the same question must be unique.', 'error');
      return;
    }

    try {
      const payload = {
        title: quizDraft.title.trim() || `${quizModal.moduleName} Quiz`,
        questions: normalizedQuestions
      };
      const res = await upsertModuleQuiz(quizModal.moduleId, payload);
      setModuleQuizzes((current) => ({ ...current, [quizModal.moduleId]: res.data.data }));
      showToast('Quiz saved', 'success');
      setQuizModal(null);
      setQuizDraft(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Quiz save failed', 'error');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quizModal) return;
    try {
      await deleteModuleQuiz(quizModal.moduleId);
      setModuleQuizzes((current) => {
        const next = { ...current };
        delete next[quizModal.moduleId];
        return next;
      });
      showToast('Quiz removed', 'success');
      setQuizModal(null);
      setQuizDraft(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Quiz removal failed', 'error');
    }
  };

  const getCourseEnrollments = (courseId) => enrollments.filter((item) => item.course_id === courseId);
  const getCourseProgress = (courseId) => progressRecords.filter((item) => item.course_id === courseId);
  const getCourseQuizSubmissions = (courseId) => quizSubmissions.filter((item) => item.course_id === courseId);
  const getCourseFeedbackEntries = (courseId) => courseFeedback.filter((item) => item.course_id === courseId);
  const getAverageRating = (entries, key) => {
    if (!entries.length) return null;
    const total = entries.reduce((sum, item) => sum + Number(item[key] || 0), 0);
    return (total / entries.length).toFixed(1);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Instructor <span className="text-gradient">Panel</span></h1>
        <p className="page-subtitle">Submit new course requests for admin approval, then manage modules, lessons, and quizzes directly.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setEditModal({})}>New Course Request</button>

      <section className="approval-list instructor-approval-list">
        {approvals.length === 0 && (
          <p className="empty-state">No course requests yet. Submit a new course to start the approval workflow.</p>
        )}
        {approvals.map((request) => (
          <article key={request._id} className="approval-card">
            <div className="approval-card-head">
              <div>
                <span className="approval-request-type">{getApprovalTitle(request)}</span>
                <h3>{getApprovalSummary(request)}</h3>
              </div>
              <span className={`status-badge status-${request.status}`}>{request.status}</span>
            </div>
            <p className="course-desc-sm">{getApprovalMeta(request)}</p>
            {request.note && request.status === 'rejected' && (
              <p className="approval-note">Admin note: {request.note}</p>
            )}
          </article>
        ))}
      </section>

      <section className="instructor-analytics">
        <h2 className="section-title">Learner Progress</h2>
        {courses.length === 0 && (
          <p className="empty-state">No course analytics yet. Publish a course to start tracking enrollments and progress.</p>
        )}
        {courses.map((course) => {
          const courseEnrollments = getCourseEnrollments(course.id);
          const courseProgress = getCourseProgress(course.id);
          const courseQuizSubs = getCourseQuizSubmissions(course.id);
          const courseFeedbackEntries = getCourseFeedbackEntries(course.id);
          const averageCourseRating = getAverageRating(courseFeedbackEntries, 'course_rating');
          const averageInstructorRating = getAverageRating(courseFeedbackEntries, 'instructor_rating');
          const modules = course.modules || [];

          return (
            <div key={`analytics-${course.id}`} className="analytics-card">
              <div className="analytics-header">
                <div>
                  <h3>{course.title}</h3>
                  <p className="course-desc-sm">{course.description}</p>
                </div>
                <span className="analytics-count">{courseEnrollments.length} enrolled</span>
              </div>
              {courseEnrollments.length === 0 ? (
                <p className="empty-state">No learners enrolled yet.</p>
              ) : (
                <div className="table-card">
                  <table className="data-table analytics-table">
                    <thead>
                      <tr>
                        <th>Learner</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Quiz Scores</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseEnrollments.map((enrollment) => {
                        const progress = courseProgress.find((item) => item.user_id === enrollment.user_id);
                        const learnerQuizzes = courseQuizSubs.filter((submission) => submission.user_id === enrollment.user_id);
                        return (
                          <tr key={`enrollment-${enrollment.id}`}>
                            <td>{enrollment.user_name || `User #${enrollment.user_id}`}</td>
                            <td>{enrollment.status}</td>
                            <td>{progress?.completion_percentage ?? 0}%</td>
                            <td>
                              <div className="quiz-summary">
                                {modules.length === 0 && <span className="quiz-pill pending">No modules yet</span>}
                                {modules.map((moduleItem) => {
                                  const submission = learnerQuizzes.find((item) => item.module_id === moduleItem.id);
                                  return (
                                    <span
                                      key={`quiz-${enrollment.user_id}-${moduleItem.id}`}
                                      className={`quiz-pill ${submission ? 'completed' : 'pending'}`}
                                    >
                                      {moduleItem.module_name}: {submission ? `${submission.score}/${submission.total}` : '—'}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="course-feedback-review-block">
                <div className="course-feedback-review-head">
                  <h4>Learner Feedback</h4>
                  <div className="course-feedback-review-metrics">
                    <span className="feedback-rating-pill">{courseFeedbackEntries.length} reviews</span>
                    {averageCourseRating && (
                      <span className="feedback-rating-pill">Course {averageCourseRating}/5</span>
                    )}
                    {averageInstructorRating && (
                      <span className="feedback-rating-pill">Instructor {averageInstructorRating}/5</span>
                    )}
                  </div>
                </div>

                {courseFeedbackEntries.length === 0 ? (
                  <p className="empty-state">No learner feedback yet.</p>
                ) : (
                  <div className="course-feedback-review-list">
                    {courseFeedbackEntries.map((entry) => (
                      <article key={`feedback-${entry.id}`} className="course-feedback-review-card">
                        <div className="course-feedback-review-meta">
                          <div>
                            <strong>{entry.learner_name || `Learner #${entry.learner_id}`}</strong>
                            <span>{entry.updated_at ? new Date(entry.updated_at).toLocaleDateString() : 'Recent feedback'}</span>
                          </div>
                          <div className="course-feedback-review-metrics">
                            <span className="feedback-rating-pill">Course {entry.course_rating}/5</span>
                            <span className="feedback-rating-pill">Instructor {entry.instructor_rating}/5</span>
                          </div>
                        </div>
                        <p>{entry.feedback}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <div className="instructor-courses">
        {courses.length === 0 && <p className="empty-state">No approved courses yet. Submit your first course request to get started.</p>}
        {courses.map((course) => (
          <div key={course.id} className="instructor-course-card">
            <div className="instructor-course-header">
              <div>
                <h3>{course.title}</h3>
                <p className="course-desc-sm">{course.description}</p>
              </div>
              <div className="instructor-actions">
                <button className="btn btn-ghost btn-xs" onClick={() => setEditModal(course)}>Edit</button>
                <button className="btn btn-danger btn-xs" onClick={() => setConfirmTarget({ type: 'courses', id: course.id })}>Delete</button>
                <button
                  className={`collapse-btn ${collapsedCourses[course.id] ? '' : 'open'}`}
                  onClick={() => toggleCourse(course.id)}
                  title={collapsedCourses[course.id] ? 'Expand course' : 'Collapse course'}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6l4 4 4-4"/>
                  </svg>
                </button>
              </div>
            </div>
            {!collapsedCourses[course.id] && (
              <div className="instructor-course-body">
                <button className="btn btn-ghost btn-xs" onClick={() => setModuleModal({ courseId: course.id })}>Add Module</button>

                <div className="module-admin-list">
                  {course.modules?.map((moduleItem) => (
                    <div key={moduleItem.id} className="module-admin-card">
                      <div className="module-admin-head">
                        <div>
                          <h4>{moduleItem.module_name}</h4>
                          <span>Sequence {moduleItem.sequence_order}</span>
                        </div>
                        <div className="instructor-actions">
                          <button className="btn btn-ghost btn-xs" onClick={() => setModuleModal({ ...moduleItem, courseId: course.id })}>Edit</button>
                          <button className="btn btn-danger btn-xs" onClick={() => setConfirmTarget({ type: 'modules', id: moduleItem.id })}>Delete</button>
                          <button
                            className={`collapse-btn ${collapsedModules[moduleItem.id] ? '' : 'open'}`}
                            onClick={() => toggleModule(moduleItem.id)}
                            title={collapsedModules[moduleItem.id] ? 'Expand module' : 'Collapse module'}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 6l4 4 4-4"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      {!collapsedModules[moduleItem.id] && (
                        <div className="module-admin-body">
                          <div className="module-admin-actions">
                            <button className="btn btn-ghost btn-xs" onClick={() => setLessonModal({ moduleId: moduleItem.id })}>Add Lesson</button>
                            <button className="btn btn-ghost btn-xs" onClick={() => openQuizModal(moduleItem)}>
                              {moduleQuizzes[moduleItem.id] ? 'Edit Quiz' : 'Add Quiz'}
                            </button>
                            {moduleQuizzes[moduleItem.id] && <span className="quiz-badge">Quiz ready</span>}
                          </div>
                          <div className="lesson-admin-list">
                            {moduleItem.lessons?.map((lesson) => (
                              <div key={lesson.id} className="lesson-admin-card">
                                <div>
                                  <strong>{lesson.lesson_name}</strong>
                                  <p>{lesson.content?.slice(0, 160) || 'No lesson content yet.'}</p>
                                </div>
                                <div className="instructor-actions">
                                  <button className="btn btn-ghost btn-xs" onClick={() => setLessonModal({ ...lesson, moduleId: moduleItem.id })}>Edit</button>
                                  <button className="btn btn-danger btn-xs" onClick={() => setConfirmTarget({ type: 'lessons', id: lesson.id })}>Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {editModal !== null && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{editModal?.id ? 'Edit' : 'New'} Course</h3>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input name="title" className="form-input" defaultValue={editModal?.title || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-input form-textarea" defaultValue={editModal?.description || ''}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Video Link</label>
                <input
                  name="youtube_video_url"
                  type="url"
                  className="form-input"
                  defaultValue={editModal?.youtube_video_url || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <span className="form-hint">Optional. Add one course-level YouTube video to show on the course overview.</span>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Submit</button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {moduleModal !== null && (
        <div className="modal-overlay" onClick={() => setModuleModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{moduleModal?.id ? 'Edit' : 'New'} Module</h3>
            <form onSubmit={handleSaveModule}>
              <div className="form-group">
                <label className="form-label">Module Name</label>
                <input name="module_name" className="form-input" defaultValue={moduleModal?.module_name || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Sequence Order</label>
                <input name="sequence_order" type="number" className="form-input" defaultValue={moduleModal?.sequence_order || 1} min="1" required />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Submit</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModuleModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lessonModal !== null && (
        <div className="modal-overlay" onClick={() => setLessonModal(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>{lessonModal?.id ? 'Edit' : 'New'} Lesson</h3>
            <form onSubmit={handleSaveLesson}>
              <div className="form-group">
                <label className="form-label">Lesson Name</label>
                <input name="lesson_name" className="form-input" defaultValue={lessonModal?.lesson_name || ''} required />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea name="content" className="form-input form-textarea" defaultValue={lessonModal?.content || ''}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">YouTube Video Link</label>
                <input
                  name="youtube_video_url"
                  type="url"
                  className="form-input"
                  defaultValue={lessonModal?.youtube_video_url || ''}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <span className="form-hint">Optional. Add one lesson-specific YouTube video for the learner view.</span>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Submit</button>
                <button type="button" className="btn btn-ghost" onClick={() => setLessonModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quizModal !== null && quizDraft && (
        <div className="modal-overlay" onClick={() => { setQuizModal(null); setQuizDraft(null); }}>
          <div className="modal-card modal-card-wide" onClick={(event) => event.stopPropagation()}>
            <h3>{moduleQuizzes[quizModal.moduleId] ? 'Edit' : 'Add'} Quiz for {quizModal.moduleName}</h3>
            <form onSubmit={handleSaveQuiz} className="quiz-editor">
              <div className="form-group">
                <label className="form-label">Quiz Title</label>
                <input
                  className="form-input"
                  value={quizDraft.title}
                  onChange={(event) => updateQuizField('title', event.target.value)}
                  required
                />
              </div>
              <div className="quiz-editor-list">
                {quizDraft.questions.map((question, index) => (
                  <div key={question.id || index} className="quiz-edit-card">
                    <div className="quiz-edit-head">
                      <strong>Question {index + 1}</strong>
                      {quizDraft.questions.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeQuizQuestion(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prompt</label>
                      <input
                        className="form-input"
                        value={question.prompt}
                        onChange={(event) => updateQuizQuestion(index, 'prompt', event.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Options</label>
                      <div className="quiz-option-list">
                        {question.options.map((option, optionIndex) => (
                          <div key={`${question.id}-option-${optionIndex}`} className="quiz-option-row">
                            <input
                              className="form-input"
                              value={option}
                              onChange={(event) => updateQuizOption(index, optionIndex, event.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                              required
                            />
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() => removeQuizOption(index, optionIndex)}
                              disabled={question.options.length <= MIN_QUIZ_OPTIONS}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={() => addQuizOption(index)}>
                        Add Option
                      </button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Correct Answer</label>
                      <select
                        className="form-input"
                        value={question.answer}
                        onChange={(event) => updateQuizQuestion(index, 'answer', event.target.value)}
                        required
                      >
                        <option value="">Select the correct option</option>
                        {question.options.map((option, optionIndex) => (
                          <option key={`${question.id}-answer-${optionIndex}`} value={option} disabled={!option.trim()}>
                            {option.trim() || `Option ${optionIndex + 1} (enter text first)`}
                          </option>
                        ))}
                      </select>
                      <span className="form-hint">Pick the exact option learners should see as correct.</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addQuizQuestion}>
                Add Question
              </button>
              <div className="modal-actions">
                {moduleQuizzes[quizModal.moduleId] && (
                  <button type="button" className="btn btn-danger" onClick={handleDeleteQuiz}>
                    Remove Quiz
                  </button>
                )}
                <button type="submit" className="btn btn-primary">Save Quiz</button>
                <button type="button" className="btn btn-ghost" onClick={() => { setQuizModal(null); setQuizDraft(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmTarget && (
        <ConfirmModal
          title="Delete this item?"
          message="This action cannot be undone."
          onCancel={() => setConfirmTarget(null)}
          onConfirm={handleDelete}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
