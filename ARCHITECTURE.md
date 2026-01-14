# 🏗️ Arquitectura del Sistema

## Visión General

La aplicación sigue una arquitectura de **3 capas** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────┐
│         Frontend (React PWA)            │
│  - Manager View (edición)               │
│  - Agent View (solo lectura)           │
│  - Autenticación                        │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
┌──────────────▼──────────────────────────┐
│      Backend (Node.js/Express)          │
│  - Routes (API endpoints)               │
│  - Services (lógica de negocio)         │
│  - Middleware (auth, validación)         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Excel Adapter Layer                │
│  - LocalExcelAdapter (MVP)              │
│  - GraphExcelAdapter (futuro)           │
│  - ExcelMappingService                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Excel File (Fuente de Verdad)      │
│  - Planning_2026-01_FULLY_EDITABLE.xlsm │
└─────────────────────────────────────────┘
```

## Componentes Principales

### 1. Excel Adapter Layer

**Propósito**: Abstraer el acceso al Excel, permitiendo cambiar entre local y cloud sin modificar el resto del código.

#### `ExcelAdapter` (Abstract Base Class)
- Define la interfaz común para todos los adapters
- Métodos: `loadExcel()`, `saveExcel()`, `readCell()`, `writeCell()`, `copyStyle()`

#### `LocalExcelAdapter` (MVP)
- Lee/escribe Excel desde filesystem local
- Usa ExcelJS para manipulación
- **CRÍTICO**: Preserva formato, colores, fórmulas, merges
- Crea backups automáticos antes de guardar
- Detecta cambios externos al archivo

#### `GraphExcelAdapter` (Futuro)
- Placeholder para integración con Microsoft Graph API
- Permitirá trabajar con Excel en SharePoint/OneDrive
- Mismo interface que LocalExcelAdapter

### 2. Mapping Service

**Propósito**: Mapear la estructura del Excel a un modelo de aplicación.

#### `ExcelMappingService`
- Convierte entre direcciones Excel (A1, B2) y coordenadas lógicas
- Encuentra agentes por nombre
- Lee headers de horas
- Obtiene paletas de colores (sites, status)
- Aplica estilos desde el Excel (NO inventa colores)

**Configuración**: `server/config/mapping.config.json`
```json
{
  "sheet": "Planning",
  "agentNameColumn": "B",
  "agentStartRow": 57,
  "hourHeaderRow": 56,
  "dayStartColumn": "PB",
  "dayEndColumn": "PY"
}
```

### 3. Planning Service

**Propósito**: Lógica de negocio para planning/timesheet.

#### Funcionalidades:
- **getAgentWeek()**: Obtiene planning de un agente
- **getManagerView()**: Obtiene planning de todos los agentes
- **updateAgentDay()**: Actualiza entrada de un día
- **validateTimeEntry()**: Valida reglas de negocio (08:00-20:00, etc.)

#### Reglas de Negocio:
- Ventana válida: 08:00 - 20:00
- Jornada estándar: 8h trabajo + 1h pausa = 9h presencia
- Pausas por defecto: 12:00-13:00 o 13:00-14:00
- Plantillas predefinidas

### 4. API Routes

#### `/api/auth`
- `POST /login`: Autenticación (MVP: mock, futuro: Entra ID)
- `GET /verify`: Verificar token

#### `/api/excel`
- `GET /status`: Verificar cambios en el archivo
- `POST /reload`: Recargar Excel
- `POST /save`: Guardar cambios
- `GET /download`: Descargar Excel

#### `/api/planning`
- `GET /manager`: Vista completa (solo managers)
- `GET /agent/:name/week`: Vista de agente
- `PUT /agent/:name/day/:day`: Actualizar día (solo managers)
- `GET /agents`: Lista de agentes
- `GET /palette`: Paletas de colores

#### `/api/audit`
- `GET /`: Log de cambios (solo managers)

### 5. Frontend

#### Estructura:
```
client/src/
├── pages/
│   ├── Login.jsx          # Página de login
│   ├── ManagerView.jsx    # Vista manager (edición)
│   └── AgentView.jsx      # Vista agent (lectura)
├── components/
│   ├── PlanningGrid.jsx   # Tabla de planning
│   ├── EditDayModal.jsx   # Modal de edición
│   └── Header.jsx         # Header con usuario
├── contexts/
│   └── AuthContext.jsx    # Estado de autenticación
└── services/
    └── api.js             # Cliente HTTP
```

#### Flujo de Datos:

1. **Login** → Obtiene token → Almacena en localStorage
2. **Carga de datos** → API → Excel → Mapeo → UI
3. **Edición** → Modal → Validación → API → Excel → Guardado
4. **Auto-save** → Cambios se guardan automáticamente

## Flujo de Guardado

```
Usuario edita → Modal valida → API recibe
    ↓
PlanningService.updateAgentDay()
    ↓
1. Limpia rango del día
2. Aplica nuevo horario (mapea tiempo → columnas)
3. Aplica estilos (copia desde paleta Excel)
4. Escribe valores (0.5 para sitios)
    ↓
ExcelAdapter.saveExcel()
    ↓
1. Crea backup
2. Escribe archivo (preserva formato)
3. Actualiza timestamp
    ↓
Audit log registra cambio
    ↓
Respuesta al frontend
```

## Preservación de Formato Excel

### ✅ Lo que SÍ se hace:
- Leer valores de celdas
- Escribir valores en celdas específicas
- Copiar estilos desde celdas de referencia
- Preservar fórmulas existentes
- Mantener merges, bordes, alineación

### ❌ Lo que NO se hace:
- Modificar estructura de hojas
- Cambiar anchos/altos de filas/columnas
- Sobrescribir fórmulas
- Inventar colores (RGB/HEX manual)
- Recrear hojas desde cero

### Implementación:

```javascript
// ✅ CORRECTO: Copiar estilo desde Excel
await adapter.copyStyle('Planning', 'K2', 'Planning', 'B62');

// ❌ INCORRECTO: Definir color manualmente
cell.fill = { fgColor: { argb: 'FFFF0000' } }; // NO HACER ESTO
```

## Seguridad y Permisos

### Roles:
- **MANAGER**: Puede editar, guardar, descargar
- **AGENT**: Solo lectura de su propio planning

### Middleware:
- `authenticate`: Verifica token
- `requireRole`: Verifica rol específico

### MVP:
- Autenticación mock (usuarios en memoria)
- Tokens simples (no JWT)

### Futuro:
- Microsoft Entra ID (Azure AD)
- JWT tokens
- Roles desde base de datos

## Tests QA

### Excel Safety Tests (`tests/excel-safety.test.js`)

Verifica:
1. ✅ Archivo existe y se puede cargar
2. ✅ Se puede escribir sin romper estructura
3. ✅ Merges preservados
4. ✅ Fórmulas preservadas
5. ✅ Colores/estilos preservados
6. ✅ Dimensiones preservadas

### Ejecución:
```bash
npm run test:excel
```

## Extensibilidad

### Agregar nuevo Adapter:

1. Extender `ExcelAdapter`
2. Implementar métodos requeridos
3. Cambiar en `server/routes/excel.js`:

```javascript
// Cambiar de:
const adapter = new LocalExcelAdapter(filePath);

// A:
const adapter = new GraphExcelAdapter(fileId, accessToken);
```

### Agregar nueva regla de negocio:

1. Modificar `PlanningService.validateTimeEntry()`
2. Actualizar frontend en `EditDayModal.jsx`

### Agregar nuevo campo editable:

1. Actualizar `mapping.config.json`
2. Modificar `PlanningService.updateAgentDay()`
3. Actualizar `EditDayModal.jsx`

## Consideraciones de Performance

- **Caché**: El adapter mantiene el workbook en memoria
- **Lazy loading**: Solo carga datos cuando se necesitan
- **Paginación**: Futuro: paginar agentes si hay muchos
- **Optimistic updates**: Frontend actualiza UI antes de confirmar

## Monitoreo y Logs

- **Audit log**: Registra todos los cambios (quién, cuándo, qué)
- **Error logging**: Errores se registran en consola
- **File change detection**: Detecta modificaciones externas

## Deployment

### Desarrollo:
```bash
npm run dev  # Backend + Frontend
```

### Producción:
```bash
npm run build  # Build frontend
NODE_ENV=production npm start  # Inicia servidor
```

### Variables de Entorno:
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno (development/production)
- `EXCEL_FILE_PATH`: Ruta al archivo Excel
