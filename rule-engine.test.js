const RuleEngine = require('../server/services/RuleEngine');

// Mock de configuración para tests
jest.mock('../server/config/rules.config.json', () => ({
  sites: {
    "TestSite": { "min": 2, "target": 3 }
  },
  breaks: {}
}), { virtual: true });

describe('Rule Engine Logic', () => {
  test('Should detect CRITICAL coverage when below min', () => {
    const assignments = [
      { site: 'TestSite', status: 'Present', agentName: 'A1' }
    ];
    
    const report = RuleEngine.analyzeCoverage(assignments);
    const siteReport = report.find(r => r.site === 'TestSite');
    
    expect(siteReport).toBeDefined();
    expect(siteReport.current).toBe(1);
    expect(siteReport.status).toBe('CRITICAL');
  });

  test('Should detect WARNING coverage when below target but >= min', () => {
    const assignments = [
      { site: 'TestSite', status: 'Present', agentName: 'A1' },
      { site: 'TestSite', status: 'Present', agentName: 'A2' }
    ];
    
    const report = RuleEngine.analyzeCoverage(assignments);
    const siteReport = report.find(r => r.site === 'TestSite');
    
    expect(siteReport.current).toBe(2);
    expect(siteReport.status).toBe('WARNING');
  });

  test('Should detect OK coverage when >= target', () => {
    const assignments = [
      { site: 'TestSite', status: 'Present', agentName: 'A1' },
      { site: 'TestSite', status: 'Present', agentName: 'A2' },
      { site: 'TestSite', status: 'Present', agentName: 'A3' }
    ];
    
    const report = RuleEngine.analyzeCoverage(assignments);
    const siteReport = report.find(r => r.site === 'TestSite');
    
    expect(siteReport.status).toBe('OK');
  });

  test('Should ignore agents not Present (e.g. OFF)', () => {
    const assignments = [
      { site: 'TestSite', status: 'OFF', agentName: 'A1' }
    ];
    const report = RuleEngine.analyzeCoverage(assignments);
    expect(report.find(r => r.site === 'TestSite').current).toBe(0);
  });
});