import { useState, useEffect } from 'react';
import { getAllCourses } from '../services/courseService';

export function useCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    getAllCourses()
      .then(res => setCourses(res.data.data || []))
      .catch(err => setError(err.response?.data?.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  return { courses, loading, error, refetch: fetchCourses };
}
