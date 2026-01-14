import './CoverageHeatmap.css';

const CoverageHeatmap = ({ data = {} }) => {
  const sites = Object.keys(data);
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const getOpacity = (count) => {
    if (!count) return 0.05;
    return Math.min(count / 5, 1);
  };

  if (sites.length === 0) {
    return <p className="heatmap-empty">No coverage data yet.</p>;
  }

  return (
    <div className="heatmap-scroll">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th>Site / Hour</th>
            {hours.map((hour) => (
              <th key={hour}>{`${String(hour).padStart(2, '0')}:00`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sites.map((site) => (
            <tr key={site}>
              <td className="heatmap-site">{site}</td>
              {hours.map((hour) => {
                const timeSlot = `${String(hour).padStart(2, '0')}:00`;
                const count = data[site][timeSlot] || 0;
                const isCritical = count === 0;
                return (
                  <td key={`${site}-${hour}`} className="heatmap-cell">
                    <span
                      className="heatmap-chip"
                      style={{
                        opacity: isCritical ? 1 : getOpacity(count),
                        backgroundColor: isCritical ? 'var(--danger-color)' : 'var(--accent-color)'
                      }}
                    >
                      {count}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CoverageHeatmap;
