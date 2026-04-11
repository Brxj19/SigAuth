export default function ProgressBar({ percentage = 0 }) {
  const pct = Math.min(Math.max(parseFloat(percentage), 0), 100);
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }}>
          <div className="progress-bar-glow"></div>
        </div>
      </div>
      <span className="progress-bar-label">{pct.toFixed(1)}%</span>
    </div>
  );
}
