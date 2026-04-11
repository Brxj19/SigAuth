import { useContext } from 'react';
import { EnrollmentUiContext } from '../context/EnrollmentUiContext';

export default function useEnrollmentUi() {
  const context = useContext(EnrollmentUiContext);

  if (!context) {
    throw new Error('useEnrollmentUi must be used within an EnrollmentUiProvider');
  }

  return context;
}
