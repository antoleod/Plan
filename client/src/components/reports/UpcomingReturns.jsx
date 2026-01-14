import './UpcomingReturns.css';

const UpcomingReturns = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return <p className="returns-empty">No returns scheduled for the next 48h.</p>;
  }

  return (
    <div className="returns-grid">
      {data.map((item, index) => (
        <div key={`${item.name}-${index}`} className="return-card">
          <div className="return-avatar">{item.name.charAt(0)}</div>
          <div className="return-details">
            <p className="return-name">{item.name}</p>
            <p className="return-meta">Returning {item.date}</p>
            <p className="return-meta">
              Previous status: <strong>{item.from}</strong>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcomingReturns;
