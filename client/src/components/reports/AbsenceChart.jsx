import './AbsenceChart.css';

const AbsenceChart = ({ data = [] }) => {
  const maxVal = Math.max(...data.map((item) => item.value), 1);

  if (data.length === 0) {
    return <p className="absence-empty">No absences recorded.</p>;
  }

  return (
    <div className="absence-chart">
      {data.map((item) => (
        <div key={item.name} className="absence-row">
          <span className="absence-label">{item.name}</span>
          <div className="absence-bar">
            <span
              className="absence-fill"
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="absence-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export default AbsenceChart;
