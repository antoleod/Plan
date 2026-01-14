const reportService = require('../server/services/ReportService');

describe('ReportService Data Transformers', () => {
  
  test('Heatmap should handle empty plan gracefully', () => {
    const emptyPlan = { agents: [] };
    const heatmap = reportService.calculateHeatmap(emptyPlan, new Date());
    expect(heatmap).toEqual({});
  });

  test('Heatmap should aggregate counts correctly', () => {
    const mockPlan = {
      agents: [
        { 
          name: 'A1', 
          week: [{ date: '2026-01-01', site: 'SiteA', status: 'Present', startTime: '09:00', endTime: '11:00' }] 
        },
        { 
          name: 'A2', 
          week: [{ date: '2026-01-01', site: 'SiteA', status: 'Present', startTime: '09:00', endTime: '10:00' }] 
        }
      ]
    };
    
    const heatmap = reportService.calculateHeatmap(mockPlan, new Date('2026-01-01'));
    
    // 09:00 -> Both A1 and A2 present (Count 2)
    expect(heatmap['SiteA']['09:00']).toBe(2);
    // 10:00 -> Only A1 present (Count 1)
    expect(heatmap['SiteA']['10:00']).toBe(1);
  });

  test('Absences should count zero when no data', () => {
    const emptyPlan = { agents: [] };
    const absences = reportService.calculateAbsences(emptyPlan);
    const sick = absences.find(a => a.name === 'Sick');
    expect(sick.value).toBe(0);
  });
});