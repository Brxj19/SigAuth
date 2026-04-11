import { createContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const EnrollmentUiContext = createContext(null);

export function EnrollmentUiProvider({ children }) {
  const { user } = useAuth();
  const [recentEnrollmentIds, setRecentEnrollmentIds] = useState([]);

  useEffect(() => {
    setRecentEnrollmentIds([]);
  }, [user?.id]);

  const markRecentEnrollment = (courseId) => {
    setRecentEnrollmentIds((current) => (
      current.includes(courseId) ? current : [...current, courseId]
    ));
  };

  const clearRecentEnrollment = (courseId) => {
    setRecentEnrollmentIds((current) => current.filter((id) => id !== courseId));
  };

  return (
    <EnrollmentUiContext.Provider
      value={{ recentEnrollmentIds, markRecentEnrollment, clearRecentEnrollment }}
    >
      {children}
    </EnrollmentUiContext.Provider>
  );
}
