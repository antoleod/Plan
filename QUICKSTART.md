# 🚀 Quick Start Guide

## Instalación Rápida

### 1. Instalar dependencias

```bash
# Backend
npm install

# Frontend
cd client
npm install
cd ..
```

### 2. Verificar Excel

Asegúrate de que el archivo `Planning_2026-01_FULLY_EDITABLE.xlsm` está en la raíz del proyecto.

### 3. Iniciar aplicación

```bash
npm run dev
```

Esto iniciará:
- ✅ Backend en `http://localhost:3001`
- ✅ Frontend en `http://localhost:3000`

### 4. Acceder a la aplicación

Abre tu navegador en: `http://localhost:3000`

## 🔐 Login

### Manager (edición completa)
- Usuario: `manager`
- Contraseña: `manager123`

### Agent (solo lectura)
- Usuario: `juan`
- Contraseña: `juan123`

## ⚙️ Configuración del Mapping

**IMPORTANTE**: Antes de usar, verifica que `server/config/mapping.config.json` coincide con tu Excel:

1. **Hoja de planning**: Nombre exacto de la hoja
2. **Columna de agentes**: Columna donde están los nombres (ej: "B")
3. **Fila de inicio**: Primera fila con datos de agentes
4. **Rango diario**: Columnas que contienen las horas del día (ej: "PB" a "PY")
5. **Paleta de colores**: Rangos donde están los estilos de sitios y estados

## 🧪 Ejecutar Tests QA

```bash
npm run test:excel
```

## 📝 Notas Importantes

1. **NO edites el Excel manualmente** mientras la app está corriendo
2. **Backups automáticos**: Se crean antes de cada guardado
3. **Conflictos**: La app detecta si el Excel fue modificado externamente
4. **Colores**: Se copian desde el Excel, nunca se inventan

## 🐛 Problemas Comunes

### "Excel file not found"
- Verifica que el archivo está en la raíz del proyecto
- Verifica la ruta en `server/routes/excel.js`

### "Sheet 'Planning' not found"
- Verifica el nombre de la hoja en `mapping.config.json`
- Asegúrate de que el Excel tiene una hoja con ese nombre exacto

### "Agent not found"
- Verifica la columna y fila de inicio en `mapping.config.json`
- Asegúrate de que los nombres están en la columna correcta

## 📦 Estructura del Proyecto

```
.
├── server/              # Backend Node.js
│   ├── adapters/       # Excel adapters
│   ├── services/       # Lógica de negocio
│   ├── routes/         # API endpoints
│   └── config/         # Configuración
├── client/             # Frontend React
│   └── src/
│       ├── pages/      # Vistas
│       └── components/  # Componentes
└── tests/              # Tests QA
```

## 🎯 Próximos Pasos

1. Ajustar `mapping.config.json` según tu Excel real
2. Probar con datos reales
3. Ejecutar tests QA
4. Configurar para producción
