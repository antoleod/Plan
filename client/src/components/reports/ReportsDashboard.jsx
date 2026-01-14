import CoverageHeatmap from './CoverageHeatmap';
import AbsenceChart from './AbsenceChart';
import StabilityChart from './StabilityChart';
import UpcomingReturns from './UpcomingReturns';
import Button from '../ui/Button';
import './ReportsDashboard.css';

function ReportsDashboard({ data, loading, error, onRefresh }) {
  return (
    <div className="reports-dashboard">
      {loading && <p className="reports-status">Loading BI Module...</p>}
      {error && <p className="reports-status reports-status--error">{error}</p>}

      {data && (
        <>
          <div className="reports-grid">
            <div className="reports-card reports-card--wide">
              <div className="reports-card-header">Coverage Heatmap (Site vs Hour)</div>
              <CoverageHeatmap data={data.heatmap} />
            </div>
            <div className="reports-card">
              <div className="reports-card-header">Absence Radar</div>
              <AbsenceChart data={data.absences} />
            </div>
            <div className="reports-card">
              <div className="reports-card-header">Operational Stability</div>
              <StabilityChart data={data.stability} />
            </div>
          </div>
          <div className="reports-card reports-card--wide">
            <div className="reports-card-header">Upcoming Returns</div>
            <UpcomingReturns data={data.returns} />
          </div>
        </>
      )}

      <div className="reports-actions">
        <Button variant="flat" size="sm" onClick={onRefresh}>
          Refresh dashboard
        </Button>
      </div>
    </div>
  );
}

export default ReportsDashboard;
