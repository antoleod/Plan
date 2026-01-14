import React from 'react';
// En una app real, estas reglas vendrían de un endpoint de configuración.
// Por ahora, las importamos desde un archivo local para que el frontend sepa los objetivos.
import { rules } from '../../config/rules';

const getStatusInfo = (current, min, target) => {
  if (current < min) return { color: '#ff4d4f', text: 'CRITICAL' }; // Red
  if (current < target) return { color: '#faad14', text: 'WARNING' }; // Yellow
  return { color: '#52c41a', text: 'OK' }; // Green
};

const CoverageCard = ({ siteName, currentCount, min, target }) => {
  const { color, text } = getStatusInfo(currentCount, min, target);

  return (
    <div style={{ border: `1px solid #e8e8e8`, borderRadius: '8px', padding: '16px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
      <h3 style={{ marginTop: 0, borderBottom: '1px solid #f0f0f0', paddingBottom: '8px', color: '#333' }}>{siteName}</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#555' }}>
          {currentCount} / {target}
        </span>
        <span style={{ color, fontWeight: 'bold', backgroundColor: `${color}20`, padding: '4px 12px', borderRadius: '12px', fontSize: '0.9em' }}>
          {text}
        </span>
      </div>
      <div style={{ marginTop: '12px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', height: '8px' }}>
        <div style={{
          width: `${Math.min((currentCount / target) * 100, 100)}%`,
          height: '100%',
          backgroundColor: color,
          transition: 'width 0.5s ease-in-out'
        }} />
      </div>
      <p style={{ fontSize: '0.8em', color: '#888', marginBottom: 0, marginTop: '4px' }}>Minimum required: {min}</p>
    </div>
  );
};

const CoverageBoard = ({ coverage }) => {
  const siteCoverage = coverage?.bySite || {};
  const siteRules = rules.coverage.sites;

  return (
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
      <h2 style={{ marginTop: 0 }}>Coverage by Site</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {Object.keys(siteRules).map(siteName => {
          const currentCount = siteCoverage[siteName] || 0;
          const { min, target } = siteRules[siteName];
          return (
            <CoverageCard
              key={siteName}
              siteName={siteName}
              currentCount={currentCount}
              min={min}
              target={target}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CoverageBoard;