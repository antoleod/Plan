# Planning Timesheet App

Web app (PWA) para gestión de planning/timesheet operativo, donde el archivo Excel oficial es la **ÚNICA fuente de verdad**.

## 🎯 Características Principales

- ✅ **Excel como fuente de verdad**: No hay base de datos paralela
- ✅ **Preservación de formato**: No se modifica estructura, colores, bordes, fórmulas del Excel
- ✅ **Colores = Datos**: Los colores se copian desde el Excel, no se inventan
- ✅ **Roles**: Manager (edición) y Agent (solo lectura)
- ✅ **PWA**: Funciona en desktop y móvil, instalable
- ✅ **Arquitectura extensible**: Preparado para Microsoft Graph API (SharePoint/OneDrive)
- 🚀 **Manager Copilot**: Dashboard con insights de cobertura en tiempo real
- 🖱️ **Drag & Drop Planning**: Reasignación visual con validación de reglas
- 🛡️ **Audit Log**: Registro inmutable de cambios (JSONL) independiente del Excel
- ⚡ **Batch Assign**: Asignación masiva de turnos y sitios
- 📅 **Pre-planning**: Generación automática de meses futuros (Copy Month)
- 📊 **Reportes**: Exportación a CSV de actividad diaria y logs de auditoría

## 🏗️ Arquitectura

```
├── server/                 # Backend Node.js
│   ├── adapters/          # Excel adapters (Local, Graph)
│   ├── services/          # Lógica de negocio
│   ├── routes/            # API endpoints (planning, insights, audit, reports)
│   └── config/            # Configuración de mapping
├── client/                # Frontend React
│   └── src/
│       ├── pages/         # Vistas (Manager, Agent, Login)
│       ├── components/    # Componentes reutilizables
│       └── contexts/      # Context API (Auth)
└── tests/                 # Tests QA
```

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- Excel file: `Planning_2026-01_FULLY_EDITABLE.xlsm` en la raíz del proyecto

### Setup

1. **Instalar dependencias del backend:**
```bash
npm install
```

2. **Instalar dependencias del frontend:**
```bash
cd client
npm install
cd ..
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env si es necesario
```

4. **Verificar que el Excel existe:**
```bash
ls Planning_2026-01_FULLY_EDITABLE.xlsm
```

## 🏃 Ejecución

### Desarrollo (backend + frontend)

```bash
npm run dev
```

Esto inicia:
- Backend en `http://localhost:3001`
- Frontend en `http://localhost:3000`

### Solo backend

```bash
npm run dev:server
```

### Solo frontend

```bash
cd client
npm run dev
```

### Producción

```bash
# Build frontend
npm run build

# Iniciar servidor
NODE_ENV=production npm start
```

## 🧪 Tests QA

Ejecutar tests de seguridad del Excel:

```bash
npm run test:excel
```

Los tests verifican:
- ✅ Integridad del archivo Excel
- ✅ Preservación de merges, formatos, colores
- ✅ No sobrescritura de fórmulas
- ✅ Mantenimiento de dimensiones

## 👥 Usuarios de Prueba

### Manager
- Usuario: `manager`
- Contraseña: `manager123`
- Permisos: Ver y editar todo el planning

### Agent
- Usuario: `juan`
- Contraseña: `juan123`
- Permisos: Solo lectura de su propio planning

## 📋 Configuración de Mapping

El archivo `server/config/mapping.config.json` define cómo mapear el Excel:

```json
{
  "sheet": "Planning",
  "agentNameColumn": "B",
  "agentStartRow": 57,
  "hourHeaderRow": 56,
  "dayStartColumn": "PB",
  "dayEndColumn": "PY",
  "palette": {
    "sites": { "range": "K2:K6", ... },
    "status": { "range": "F2:F6", ... }
  }
}
```

**⚠️ IMPORTANTE**: Ajusta estos valores según la estructura real de tu Excel.

## 🧠 Motor de Reglas (Rule Engine)

El sistema utiliza un `RuleEngine` centralizado para validar cada movimiento en el planning.
Las reglas se configuran en `server/config/rules.config.json`.

Para más detalles sobre la lógica de cobertura, pausas y rotación, consulta el archivo:
📄 RULES.md

## 🎨 Colores y Estilos

**CRÍTICO**: Los colores en el Excel son **datos**, no decoración.

- ✅ Los estilos se **copian** desde las celdas de leyenda del Excel
- ❌ **PROHIBIDO** definir colores manualmente con RGB/HEX
- ❌ **PROHIBIDO** "pintar" desde código inventando estilos

Las paletas de colores se leen desde:
- **Sitios**: Columna K (K2:K6)
- **Estados**: Columna F (F2:F6)

## 💾 Guardado

- **Autosave**: Los cambios se guardan automáticamente al editar
- **Manual**: Botón "Guardar" disponible
- **Conflictos**: El sistema detecta si el archivo fue modificado externamente
- **Backup**: Se crea backup automático antes de guardar

## 🔄 Futuro: Microsoft Graph API

La arquitectura está preparada para integrar SharePoint/OneDrive:

1. Implementar `GraphExcelAdapter` (ya existe como placeholder)
2. Configurar autenticación con Microsoft Entra ID
3. Cambiar el adapter en `server/routes/excel.js`

## 🐛 Troubleshooting

### Error: "Excel file not found"
- Verifica que `Planning_2026-01_FULLY_EDITABLE.xlsm` está en la raíz del proyecto
- Verifica la ruta en `server/routes/excel.js`

### Error: "Sheet 'Planning' not found"
- Verifica el nombre de la hoja en `mapping.config.json`
- Asegúrate de que el Excel tiene una hoja llamada "Planning"

### Error: "Agent not found"
- Verifica la columna y fila de inicio en `mapping.config.json`
- Asegúrate de que los nombres de agentes están en la columna correcta

## 📝 Notas Importantes

1. **NO modificar el Excel manualmente mientras la app está corriendo** (puede causar conflictos)
2. **Siempre hacer backup** antes de usar en producción
3. **Los tests QA son obligatorios** antes de desplegar
4. **El Excel debe ser .xlsm** para preservar macros

## 📄 Licencia

MIT
