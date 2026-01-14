const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Configurar variable de entorno ANTES de requerir rutas que usan ExcelService
process.env.EXCEL_FILE_NAME = 'Planning_TEST_INSIGHTS.xlsm';

const insightsRouter = require('../server/routes/insights');

const app = express();
app.use('/api/insights', insightsRouter);

describe('Integration: Insights API', () => {
  const ORIGINAL_PATH = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE.xlsm');
  const TEST_PATH = path.join(__dirname, `../${process.env.EXCEL_FILE_NAME}`);

  beforeAll(async () => {
    // 1. Crear Excel de prueba copiando el original
    // Esto asegura que probamos contra la estructura real del archivo
    if (fs.existsSync(ORIGINAL_PATH)) {
      fs.copyFileSync(ORIGINAL_PATH, TEST_PATH);
    } else {
      // Fallback para entornos donde no existe el archivo original (CI/CD)
      // En un caso real, aquí crearíamos un Excel mock mínimo
      console.warn("Original Excel not found, skipping file creation step.");
    }
  });

  afterAll(() => {
    // Limpieza
    if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
    // Borrar backups generados
    const dir = path.dirname(TEST_PATH);
    fs.readdirSync(dir).forEach(f => {
      if (f.startsWith('Planning_TEST_INSIGHTS_backup')) fs.unlinkSync(path.join(dir, f));
    });
  });

  test('GET /api/insights/coverage returns valid structure', async () => {
    // Consultamos una fecha cualquiera. Incluso si está vacía, debe devolver un array (vacío o con datos).
    const res = await request(app).get('/api/insights/coverage?date=2026-01-01');
    
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    
    if (res.body.length > 0) {
      const item = res.body[0];
      expect(item).toHaveProperty('site');
      expect(item).toHaveProperty('status');
      expect(['OK', 'WARNING', 'CRITICAL']).toContain(item.status);
    }
  });

  test('GET /api/insights/alerts returns valid structure', async () => {
    // Consultamos la misma fecha. Debe devolver un array de alertas.
    const res = await request(app).get('/api/insights/alerts?date=2026-01-01');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Si se detecta alguna alerta, verificamos su estructura
    if (res.body.length > 0) {
      const item = res.body[0];
      expect(item).toHaveProperty('type', 'BREAK_COVERAGE');
      expect(item).toHaveProperty('severity');
      expect(item).toHaveProperty('message');
    }
  });
});