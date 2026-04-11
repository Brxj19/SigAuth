import { useState, useEffect } from 'react';
import { getAllProgress } from '../services/progressService';

export function useProgress(userId) {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgress = () => {
    setLoading(true);
    getAllProgress()
      .then(res => {
        const all = res.data.data || [];
        setProgress(userId ? all.filter(p => p.user_id === userId) : all);
      })
      .catch(() => setProgress([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProgress(); }, [userId]);

  return { progress, loading, refetch: fetchProgress };
}
