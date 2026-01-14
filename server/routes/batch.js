const express = require('express');
const router = express.Router();
const excelService = require('../services/ExcelService');
const { requireRole } = require('../middleware/auth');
const { logAction } = require('../services/AuditService');

/**
 * POST /api/batch/update
 * Permite actualizar múltiples celdas a la vez (ej. rango de ausencias)
 * y registra la acción en el log de auditoría.
 */
router.post('/update', requireRole('manager'), async (req, res) => {
  try {
    const { changes, reason } = req.body;

    if (!changes || !Array.isArray(changes) || changes.length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Audit reason is required for batch updates' });
    }

    // --- Lógica de Auditoría ---
    await logAction({
      user: req.user.username,
      action: 'BATCH_UPDATE',
      details: `Applied batch update to ${changes.length} cells.`,
      reason: reason,
    });

    await excelService.updateAssignments(changes);

    res.json({ success: true, count: changes.length });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;