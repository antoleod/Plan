const express = require('express');
const router = express.Router();
const insightsController = require('../controllers/insightsController');
const { protect, managerOnly } = require('../middleware/authMiddleware'); // Asumiendo middleware de auth

// GET /api/insights/daily?date=YYYY-MM-DD
// Devuelve un informe completo para el día: cobertura, alertas, etc.
// Protegido para que solo los managers puedan acceder.
router.get('/daily', insightsController.getDailyInsights);

module.exports = router;