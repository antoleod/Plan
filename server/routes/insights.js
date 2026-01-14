const express = require('express');
const router = express.Router();
const excelService = require('../services/ExcelService');
const rules = require('../config/rules.config.json');
const { requireRole } = require('../middleware/auth');

// GET /api/insights/coverage - Obtiene el estado de cobertura en tiempo real
router.get('/coverage', requireRole('manager'), async (req, res) => {
  try {
    // Obtiene la fecha de hoy en formato YYYY-MM-DD
    const today = new Date();
    const dateString = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);

    const assignments = await excelService.getAssignmentsForDay(dateString);

    const coverageRules = rules.coverage;
    const siteCounts = {};

    // Inicializa contadores para todos los sitios definidos en las reglas
    for (const siteName in coverageRules) {
      siteCounts[siteName] = {
        current: 0,
        min: coverageRules[siteName].min,
        target: coverageRules[siteName].target,
      };
    }

    // Cuenta agentes presentes por sitio
    assignments.forEach(assignment => {
      if (assignment.status === 'Present' && assignment.site && siteCounts[assignment.site]) {
        siteCounts[assignment.site].current++;
      }
    });

    // Determina el estado (rojo/amarillo/verde) para cada sitio
    const coverageStatus = Object.entries(siteCounts).map(([site, data]) => {
      let status = 'green';
      if (data.current < data.min) {
        status = 'red';
      } else if (data.current < data.target) {
        status = 'yellow';
      }
      return { site, ...data, status };
    });

    res.json(coverageStatus);
  } catch (error) {
    console.error('Error getting coverage insights:', error);
    res.status(500).json({ error: 'Failed to retrieve coverage data.' });
  }
});

module.exports = router;