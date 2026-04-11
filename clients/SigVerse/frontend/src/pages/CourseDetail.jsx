import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useEnrollmentUi from '../hooks/useEnrollmentUi';
import useToast from '../hooks/useToast';
import { getCourseById } from '../services/courseService';
import { getMyCourseFeedback, saveCourseFeedback, getCourseFeedback, replyToFeedback } from '../services/courseFeedbackService';
import { createEnrollment, getAllEnrollments } from '../services/enrollmentService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import Icon from '../components/Icon';
import { getCourseCategory, getRecommendedVideos } from '../utils/courseMeta';
import { downloadCoursePdf } from '../utils/pdf';

function getLessonPreview(content) {
  if (!content) return 'Detailed lesson notes will appear here once the lesson content is available.';
  return content.split('\n\n')[0].replace(/^Overview\s*/i, '').trim();
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentEnrollmentIds, markRecentEnrollment } = useEnrollmentUi();
  const { showToast } = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    course_rating: '',
    instructor_rating: '',
    feedback: ''
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [hasSavedFeedback, setHasSavedFeedback] = useState(false);
  const [publicReviews, setPublicReviews] = useState([]);
  const [instructorReplies, setInstructorReplies] = useState({});
  const [replyDraft, setReplyDraft] = useState({});
  const [replySubmitting, setReplySubmitting] = useState({});

  const courseId = Number(id);

  useEffect(() => {
    getCourseById(id)
      .then(res => setCourse(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Course not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const sampleReviews = [
      {
        id: 'sample-1',
        learner_name: 'Arjun Mehta',
        course_rating: 5,
        instructor_rating: 5,
        feedback: 'Absolutely fantastic course. The structure is clear, the content is practical, and the instructor explains complex concepts in a way that actually sticks. Best course I have taken on this platform.',
        updated_at: '2026-02-14T10:30:00Z',
        instructor_reply: null
      },
      {
        id: 'sample-2',
        learner_name: 'Priya Nair',
        course_rating: 4,
        instructor_rating: 5,
        feedback: 'Really well-structured content. I loved how each module builds on the previous one. Would appreciate a few more hands-on exercises but overall a very strong course.',
        updated_at: '2026-02-20T14:15:00Z',
        instructor_reply: 'Thank you Priya! Great suggestion \u2014 we are working on adding more hands-on exercises to the next module update.'
      },
      {
        id: 'sample-3',
        learner_name: 'Ravi Shankar',
        course_rating: 5,
        instructor_rating: 4,
        feedback: 'The depth of content here is impressive. I came in as a complete beginner and finished feeling genuinely confident. The video resources and lesson notes together make a great combination.',
        updated_at: '2026-03-05T09:00:00Z',
        instructor_reply: null
      }
    ];

    const replies = {};
    sampleReviews.forEach((r) => {
      if (r.instructor_reply) replies[r.id] = r.instructor_reply;
    });

    getCourseFeedback(id)
      .then((res) => {
        const real = (res.data.data || []).map((r) => ({
          id: r.id,
          learner_name: r.learner_name || 'Learner',
          course_rating: r.course_rating,
          instructor_rating: r.instructor_rating,
          feedback: r.feedback,
          updated_at: r.updated_at,
          instructor_reply: r.instructor_reply || null
        }));
        setPublicReviews([...real, ...sampleReviews]);
        const realReplies = {};
        real.forEach((r) => {
          if (r.instructor_reply) realReplies[r.id] = r.instructor_reply;
        });
        setInstructorReplies({ ...replies, ...realReplies });
      })
      .catch(() => {
        setPublicReviews(sampleReviews);
        setInstructorReplies(replies);
      });
  }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'learner') {
      setIsEnrolled(false);
      return;
    }

    let cancelled = false;
    setIsEnrolled(false);

    getAllEnrollments()
      .then((res) => {
        if (cancelled) return;
        const mine = (res.data.data || []).filter((item) => item.user_id === user.id);
        setIsEnrolled(mine.some((item) => item.course_id === Number(id)));
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const isCourseEnrolled = isEnrolled || recentEnrollmentIds.includes(courseId);

  useEffect(() => {
    if (!user || user.role !== 'learner' || !isCourseEnrolled) {
      setFeedbackForm({
        course_rating: '',
        instructor_rating: '',
        feedback: ''
      });
      setHasSavedFeedback(false);
      return;
    }

    let cancelled = false;
    setFeedbackLoading(true);

    getMyCourseFeedback(courseId)
      .then((res) => {
        if (cancelled) return;

        const existing = res.data.data;
        if (!existing) {
          setFeedbackForm({
            course_rating: '',
            instructor_rating: '',
            feedback: ''
          });
          setHasSavedFeedback(false);
          return;
        }

        setFeedbackForm({
          course_rating: String(existing.course_rating ?? ''),
          instructor_rating: String(existing.instructor_rating ?? ''),
          feedback: existing.feedback || ''
        });
        setHasSavedFeedback(true);
      })
      .catch(() => {
        if (cancelled) return;
        setFeedbackForm({
          course_rating: '',
          instructor_rating: '',
          feedback: ''
        });
        setHasSavedFeedback(false);
      })
      .finally(() => {
        if (!cancelled) setFeedbackLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId, isCourseEnrolled, user]);

  const handleEnroll = async () => {
    if (!user || isCourseEnrolled) return;

    try {
      await createEnrollment({ user_id: user.id, course_id: courseId });
      markRecentEnrollment(courseId);
      setIsEnrolled(true);
      showToast('Enrolled successfully!', 'success');
      navigate('/courses', { replace: true });
    } catch (err) {
      showToast(err.response?.data?.message || 'Enrollment failed', 'error');
    }
  };

  const handleReplyChange = (reviewId, value) => {
    setReplyDraft((prev) => ({ ...prev, [reviewId]: value }));
  };

  const handleReplySubmit = async (reviewId) => {
    const text = (replyDraft[reviewId] || '').trim();
    if (!text) return;
    setReplySubmitting((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await replyToFeedback(reviewId, text);
      setInstructorReplies((prev) => ({ ...prev, [reviewId]: text }));
      setReplyDraft((prev) => ({ ...prev, [reviewId]: '' }));
      showToast('Reply posted successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post reply', 'error');
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleFeedbackField = (field, value) => {
    setFeedbackForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();

    if (!user || user.role !== 'learner' || !isCourseEnrolled) return;

    setFeedbackSubmitting(true);
    try {
      const res = await saveCourseFeedback({
        course_id: courseId,
        course_rating: Number(feedbackForm.course_rating),
        instructor_rating: Number(feedbackForm.instructor_rating),
        feedback: feedbackForm.feedback.trim()
      });

      const savedFeedback = res.data.data;
      setFeedbackForm({
        course_rating: String(savedFeedback.course_rating),
        instructor_rating: String(savedFeedback.instructor_rating),
        feedback: savedFeedback.feedback || ''
      });
      setHasSavedFeedback(true);
      showToast('Feedback saved successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save feedback right now.', 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="page-container"><ErrorMessage message={error} /></div>;

  const totalModules = course.modules?.length || 0;
  const totalLessons = course.modules?.reduce((sum, module) => sum + (module.lessons?.length || 0), 0) || 0;
  const learners = Number(course.learner_count || 0);
  const category = getCourseCategory(course);
  const featuredModule = course.modules?.[0] || null;
  const recommendedVideos = getRecommendedVideos(course, featuredModule, null);

  return (
    <div className="page-container">
      {/* <button className="btn btn-ghost" onClick={() => navigate(-1)}>
        <Icon name="back" size={14} />
        <span>Back</span>
      </button> */}
      <section className="course-detail-hero">
        <div className="detail-header">
          <span className="section-eyebrow">Course deep dive</span>
          <h1 className="page-title">{course.title}</h1>
          <span className="course-card-id">{category}</span>
          <span className="detail-instructor">By {course.instructor_name || 'Instructor'}</span>
          <p className="detail-description">{course.description}</p>
          <div className="detail-actions">
            {user?.role === 'learner' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleEnroll}
                disabled={isCourseEnrolled}
              >
                <Icon name="enrollments" size={14} />
                <span>{isCourseEnrolled ? 'Enrolled' : 'Enroll Now'}</span>
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => downloadCoursePdf({ ...course, category })}>
              <Icon name="download" size={14} />
              <span>Download Course PDF</span>
            </button>
          </div>
        </div>
        <div className="course-detail-metrics">
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{totalModules}</span>
            <span className="course-detail-metric-label">Modules</span>
          </div>
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{totalLessons}</span>
            <span className="course-detail-metric-label">Lessons</span>
          </div>
          <div className="course-detail-metric">
            <span className="course-detail-metric-value">{learners}</span>
            <span className="course-detail-metric-label">Learners</span>
          </div>
        </div>
      </section>

      <section className="modules-section">
        <h2 className="section-title">Video Resources</h2>
        <div className="video-resource-grid">
          {recommendedVideos.map((video) => (
            <article key={video.id || video.youtubeId} className="video-card">
              <div className="video-card-head">
                <Icon name="video" size={16} />
                <span>{video.title}</span>
              </div>
              <div className="video-embed-shell">
                <iframe
                  src={video.embedUrl || `https://www.youtube.com/embed/${video.youtubeId}`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="modules-section">
        <h2 className="section-title">Modules & Lessons</h2>
        {course.modules && course.modules.length > 0 ? (
          course.modules.map((mod, i) => (
            <div key={mod.id} className="module-card">
              <div className="module-header">
                <span className="module-order">{i + 1}</span>
                <div className="module-header-copy">
                  <h3 className="module-name">{mod.module_name}</h3>
                  <span className="module-subtitle">{mod.lessons?.length || 0} guided lessons in this module</span>
                </div>
              </div>
              {mod.lessons && mod.lessons.length > 0 ? (
                <ul className="lesson-list">
                  {mod.lessons.map(lesson => (
                    <li key={lesson.id} className="lesson-item lesson-item-detailed">
                      <span className="lesson-icon"><Icon name="document" size={14} /></span>
                      <div className="lesson-item-copy">
                        <span className="lesson-item-title">{lesson.lesson_name}</span>
                        <p className="lesson-item-preview">{getLessonPreview(lesson.content)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty-lessons">No lessons yet</p>
              )}
            </div>
          ))
        ) : (
          <p className="empty-state">No modules added yet.</p>
        )}
      </div>

      <section className="modules-section">
        <h2 className="section-title">Learner Reviews</h2>
        <div className="reviews-summary">
          {publicReviews.length > 0 && (
            <div className="reviews-avg-block">
              <span className="reviews-avg-number">
                {(publicReviews.reduce((s, r) => s + r.course_rating, 0) / publicReviews.length).toFixed(1)}
              </span>
              <div className="reviews-avg-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`rating-star ${star <= Math.round(publicReviews.reduce((s, r) => s + r.course_rating, 0) / publicReviews.length) ? 'rating-star-filled' : 'rating-star-empty'}`}
                  >★</span>
                ))}
              </div>
              <span className="reviews-count">{publicReviews.length} reviews</span>
            </div>
          )}
        </div>
        <div className="reviews-list">
          {publicReviews.map((review) => (
            <article key={review.id} className="review-card">
              <div className="review-card-head">
                <div className="review-avatar">{review.learner_name.charAt(0).toUpperCase()}</div>
                <div className="review-meta">
                  <strong className="review-learner-name">{review.learner_name}</strong>
                  <span className="review-date">
                    {new Date(review.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="review-ratings">
                  <span className="review-rating-chip">Course {review.course_rating}/5</span>
                  <span className="review-rating-chip">Instructor {review.instructor_rating}/5</span>
                </div>
              </div>
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={`rating-star ${star <= review.course_rating ? 'rating-star-filled' : 'rating-star-empty'}`}>★</span>
                ))}
              </div>
              <p className="review-feedback-text">{review.feedback}</p>
              {instructorReplies[review.id] && (
                <div className="instructor-reply-block">
                  <div className="instructor-reply-label">
                    <span className="instructor-reply-icon">↩</span>
                    Instructor reply
                  </div>
                  <p className="instructor-reply-text">{instructorReplies[review.id]}</p>
                </div>
              )}
              {user?.role === 'instructor' && !instructorReplies[review.id] && (
                <div className="instructor-reply-form">
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Write a reply to this review..."
                    value={replyDraft[review.id] || ''}
                    onChange={(e) => handleReplyChange(review.id, e.target.value)}
                    rows={2}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => handleReplySubmit(review.id)}
                    disabled={replySubmitting[review.id] || !(replyDraft[review.id] || '').trim()}
                  >
                    {replySubmitting[review.id] ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {user?.role === 'learner' && (
        <section className="modules-section course-feedback-section">
          <div className="course-feedback-head">
            <div>
              <h2 className="section-title">Course Feedback</h2>
              <p className="course-feedback-subtitle">Rate the learning experience, rate the instructor, and leave feedback after you enroll.</p>
            </div>
            {hasSavedFeedback && <span className="course-feedback-status">Saved</span>}
          </div>

          {!isCourseEnrolled ? (
            <div className="course-feedback-empty">
              Enroll in this course to share a rating for the content, the instructor, and your written feedback.
            </div>
          ) : feedbackLoading ? (
            <LoadingSpinner />
          ) : (
            <form className="course-feedback-card" onSubmit={handleFeedbackSubmit}>
              <div className="course-feedback-grid">
                <div className="form-group">
                  <label className="form-label">Course Rating</label>
                  <select
                    className="form-input"
                    value={feedbackForm.course_rating}
                    onChange={(event) => handleFeedbackField('course_rating', event.target.value)}
                    required
                  >
                    <option value="">Select a rating</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={`course-rating-${value}`} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Instructor Rating</label>
                  <select
                    className="form-input"
                    value={feedbackForm.instructor_rating}
                    onChange={(event) => handleFeedbackField('instructor_rating', event.target.value)}
                    required
                  >
                    <option value="">Select a rating</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={`instructor-rating-${value}`} value={value}>
                        {value} / 5
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea
                  className="form-input form-textarea"
                  value={feedbackForm.feedback}
                  onChange={(event) => handleFeedbackField('feedback', event.target.value)}
                  placeholder="What helped most, what could improve, and how the instructor experience felt."
                  minLength={8}
                  maxLength={1000}
                  required
                />
                <span className="form-hint">Your latest submission will stay attached to this course and instructor.</span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={feedbackSubmitting}>
                {feedbackSubmitting ? 'Saving...' : hasSavedFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
}
