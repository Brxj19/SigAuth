import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (['/login', '/auth/callback', '/dashboard'].includes(location.pathname)) return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <button type="button" className="global-back-btn" onClick={handleBack}>
      <Icon name="back" size={16} />
      <span>Back</span>
    </button>
  );
}
