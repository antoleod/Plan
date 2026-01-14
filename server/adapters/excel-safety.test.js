const LocalExcelAdapter = require('../server/adapters/LocalExcelAdapter');
const path = require('path');
const fs = require('fs');

describe('Excel Safety & Integrity (Regla de Oro)', () => {
  const ORIGINAL_PATH = path.join(__dirname, '../Planning_2026-01_FULLY_EDITABLE.xlsm');
  const TEST_PATH = path.join(__dirname, '../Planning_TEST_SAFETY.xlsm');
  let adapter;

  beforeAll(async () => {
    // Copiar archivo real para test destructivo
    fs.copyFileSync(ORIGINAL_PATH, TEST_PATH);
    adapter = new LocalExcelAdapter(TEST_PATH);
    await adapter.loadExcel();
  });

  afterAll(() => {
    // Limpieza
    if (fs.existsSync(TEST_PATH)) fs.unlinkSync(TEST_PATH);
    // Borrar backups generados por el test
    const dir = path.dirname(TEST_PATH);
    fs.readdirSync(dir).forEach(f => {
      if (f.startsWith('Planning_TEST_SAFETY_backup')) fs.unlinkSync(path.join(dir, f));
    });
  });

  test('Should preserve cell styles when writing values', async () => {
    const sheetName = 'Planning';
    const testCell = 'B57'; // Primer agente

    // 1. Leer estado original
    const original = await adapter.readCell(sheetName, testCell);
    expect(original.style).toBeDefined();
    
    // 2. Escribir nuevo valor
    const newValue = 'TEST AGENT ' + Date.now();
    await adapter.writeCell(sheetName, testCell, newValue, true); // true = preserveStyle
    await adapter.saveExcel();

    // 3. Recargar y verificar
    const newAdapter = new LocalExcelAdapter(TEST_PATH);
    await newAdapter.loadExcel();
    const modified = await newAdapter.readCell(sheetName, testCell);

    expect(modified.value).toBe(newValue);
    // Verificar que el estilo (fondo, fuente, bordes) es idéntico al original
    expect(JSON.stringify(modified.style)).toBe(JSON.stringify(original.style));
  });

  test('Should not break formulas', async () => {
    // Asumimos que hay fórmulas de totales, por ejemplo en columnas de resumen
    // Si no conocemos una celda exacta con fórmula, verificamos que writeCell no sobrescriba si hay fórmula
    // (Basado en la lógica de LocalExcelAdapter.js que tiene un check de seguridad)
    
    // Mock de celda con fórmula
    const sheet = adapter.getSheet('Planning');
    const cell = sheet.getCell('Z100'); // Celda hipotética
    cell.formula = 'SUM(A1:A10)';
    
    await adapter.writeCell('Planning', 'Z100', 999);
    expect(cell.formula).toBe('SUM(A1:A10)'); // No debe haber cambiado
    expect(cell.value).not.toBe(999); // El valor no se escribe si hay fórmula (según adapter actual)
  });
});