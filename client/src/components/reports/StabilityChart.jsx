import './StabilityChart.css';

const StabilityChart = ({ data = {} }) => {
  const total = (data.manual || 0) + (data.scheduled || 0);
  const manualPct = total ? Math.round((data.manual / total) * 100) : 0;

  return (
    <div className="stability-chart">
      <div className="stability-ring">
        <svg viewBox="0 0 36 36">
          <path
            className="stability-track"
            d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831"
          />
          <path
            className="stability-progress"
            d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831"
            strokeDasharray={`${100 - manualPct}, 100`}
          />
        </svg>
        <div className="stability-score">
          <span>{100 - manualPct}%</span>
          <small>Stability</small>
        </div>
      </div>
      <p className="stability-meta">
        {data.manual || 0} manual overrides vs {data.scheduled || 0} scheduled actions
      </p>
    </div>
  );
};

export default StabilityChart;
