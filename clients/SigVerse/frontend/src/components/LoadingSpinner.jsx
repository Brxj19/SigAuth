export default function LoadingSpinner() {
  return (
    <div className="spinner-overlay">
      <div className="spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="spinner-text">Loading...</p>
    </div>
  );
}
