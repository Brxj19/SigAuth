import Icon from './Icon';

export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="error-message">
      <span className="error-icon"><Icon name="warning" size={16} /></span>
      <p>{message}</p>
    </div>
  );
}
