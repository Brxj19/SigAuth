import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePageTitle } from '../hooks/usePageTitle';
import { getAllEnrollments } from '../services/enrollmentService';
import { getAllPerformance } from '../services/performanceService';
import { getAllProgress } from '../services/progressService';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from '../components/Icon';
import { formatDate, formatPercentage } from '../utils/helpers';

const PERFORMANCE_PER_PAGE = 8;

export default function PerformanceView() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  usePageTitle('Performance');

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getAllPerformance(),
      getAllEnrollments(),
      getAllProgress()
    ])
      .then(([performanceRes, enrollmentRes, progressRes]) => {
        const performanceData = performanceRes.data.data || [];
        const enrollmentData = enrollmentRes.data.data || [];
        const progressData = progressRes.data.data || [];

        setRecords(performanceData.filter((item) => item.user_id === user?.id || !('user_id' in item)));
        setEnrollments(enrollmentData.filter((item) => item.user_id === user?.id || !('user_id' in item)));
        setProgressRecords(progressData.filter((item) => item.user_id === user?.id || !('user_id' in item)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const avgScore = records.length ? (records.reduce((s, r) => s + parseFloat(r.score), 0) / records.length).toFixed(1) : 0;
  const sortedRecords = [...records].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
  const avgProgress = progressRecords.length
    ? (progressRecords.reduce((sum, item) => sum + parseFloat(item.completion_percentage || 0), 0) / progressRecords.length).toFixed(1)
    : '0.0';
  const activeCourses = enrollments.filter((item) => item.status === 'active').length;
  const latestAssessment = sortedRecords[0] || null;
  const progressByCourseId = new Map(progressRecords.map((item) => [item.course_id, item]));
  const learningSnapshot = enrollments
    .map((enrollment) => {
      const progress = progressByCourseId.get(enrollment.course_id);
      return {
        ...enrollment,
        completion_percentage: progress?.completion_percentage || 0,
        last_accessed: progress?.last_accessed || enrollment.enrolled_at
      };
    })
    .sort((a, b) => Number(b.completion_percentage || 0) - Number(a.completion_percentage || 0));
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / PERFORMANCE_PER_PAGE));
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * PERFORMANCE_PER_PAGE,
    currentPage * PERFORMANCE_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My <span className="text-gradient">Performance</span></h1>
        <p className="page-subtitle">Track your scores across courses</p>
      </div>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card stat-card-score">
          <div className="stat-icon"><Icon name="certificate" size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{records.length ? avgScore : 'N/A'}</span>
            <span className="stat-label">Average Score</span>
          </div>
        </div>
        <div className="stat-card stat-card-courses">
          <div className="stat-icon"><Icon name="performance" size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{records.length}</span>
            <span className="stat-label">Assessments</span>
          </div>
        </div>
        <div className="stat-card stat-card-enrolled">
          <div className="stat-icon"><Icon name="enrollments" size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{activeCourses}</span>
            <span className="stat-label">Active Courses</span>
          </div>
        </div>
        <div className="stat-card stat-card-progress">
          <div className="stat-icon"><Icon name="courses" size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{formatPercentage(avgProgress)}</span>
            <span className="stat-label">Average Progress</span>
          </div>
        </div>
      </div>
      {records.length === 0 ? (
        <>
          <div className="empty-state-container">
            <p className="empty-state">No quiz-based performance records yet.</p>
            <p className="page-subtitle">Your real learning progress is still shown below, and quiz scores will appear here automatically after you submit module quizzes.</p>
          </div>
          {learningSnapshot.length > 0 && (
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr><th>Course</th><th>Status</th><th>Progress</th><th>Last Activity</th></tr>
                </thead>
                <tbody>
                  {learningSnapshot.map((item) => (
                    <tr key={item.id}>
                      <td>{item.course_title || `Course #${item.course_id}`}</td>
                      <td>{item.status}</td>
                      <td>{formatPercentage(item.completion_percentage)}</td>
                      <td>{formatDate(item.last_accessed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="table-card" style={{ marginBottom: '1.5rem' }}>
            <table className="data-table">
              <thead>
                <tr><th>Latest Assessment</th><th>Score</th><th>Date</th><th>Learning Progress</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>{latestAssessment?.course_title || `Course #${latestAssessment?.course_id}`}</td>
                  <td><span className={`score-badge ${parseFloat(latestAssessment?.score || 0) >= 70 ? 'score-high' : 'score-low'}`}>{latestAssessment?.score ?? 'N/A'}</span></td>
                  <td>{formatDate(latestAssessment?.completed_at)}</td>
                  <td>{formatPercentage(progressByCourseId.get(latestAssessment?.course_id)?.completion_percentage || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr><th>Course</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {paginatedRecords.map(r => (
                  <tr key={r.id}>
                    <td>{r.course_title || `Course #${r.course_id}`}</td>
                    <td><span className={`score-badge ${parseFloat(r.score) >= 70 ? 'score-high' : 'score-low'}`}>{r.score}</span></td>
                    <td>{formatDate(r.completed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={records.length}
            itemLabel="assessments"
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
