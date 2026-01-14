# 📋 Changelog - Mejoras Implementadas

## [1.1.0] - 2026-01-13

### ✅ Cambios Implementados

#### 🔒 Excel Safety (CRÍTICO)
- ✅ Filtro estricto: Solo agentes B57-B98 (41 agentes detectados)
- ✅ Preservación de formato: Layout, colores, fórmulas intactos
- ✅ Tests QA: Verificación automática de integridad

#### 🎯 Funcionalidades Nuevas

**Manager View:**
- ➕ Botón "Añadir Agente" siempre visible
- Modal para añadir nuevo agente (nombre, función, site)
- Inserta en primera fila vacía del rango 57-98
- Optimistic update: Aparece inmediatamente sin recargar
- Validación: Error si no hay espacio disponible

**Agent View:**
- 📅 "Mi Planning" (siempre visible)
- 👥 "Mi Grupo" (agentes mismo site, expandido)
- 📋 "Otros Agentes" (colapsable con contador)
- 🔍 Búsqueda integrada (filtra en todos los grupos)

**Horarios Humanos:**
- ✅ Muestra segmentos legibles: `08:00–17:00` en lugar de `0.5`
- ✅ Soporta múltiples segmentos: `08:00–13:00 + 16:00–19:00`
- ✅ Badges para site y status
- ✅ Tooltips con información completa

**UX Mejorada:**
- ✅ Sticky headers (días arriba, agente izquierda)
- ✅ Sombras para mejor visibilidad al scroll
- ✅ Badges visuales para site/status
- ✅ Loading states mejorados
- ✅ Error handling más claro

### 🔧 Cambios Técnicos

**Backend:**
- `ExcelMappingService.getAllAgents()`: Filtra rango 57-98
- `PlanningService.buildDaySummary()`: Convierte slots a segmentos
- `POST /api/planning/agents`: Endpoint para añadir agente
- `findFirstEmptyRow()`: Encuentra primera fila vacía en rango

**Frontend:**
- `PlanningGrid`: Muestra `daySummary.segmentsText` + badges
- `AddAgentModal`: Nuevo componente para añadir agente
- `AgentView`: Grouping por site con búsqueda
- CSS mejorado: Sticky headers con z-index correcto

**Tests:**
- `tests/agent-range.test.js`: Verifica rango 57-98
- Tests existentes actualizados y pasando

### 📊 Estadísticas

- **Agentes detectados**: 41 (solo rango 57-98)
- **Headers de horas**: 24 (columnas PB-PY)
- **Sitios**: 5 (WD Spinelli, WD Kohl, WD Martens, WD LUX/STR, Serv. phone)
- **Estados**: 5 (Present, Telework, Mission, Travel, Int. training)

### 🐛 Bugs Corregidos

- ✅ Frontend ahora muestra segmentos en lugar de "0.5"
- ✅ Sticky headers funcionan correctamente
- ✅ Agentes fuera del rango ya no se muestran
- ✅ Optimistic updates funcionan al añadir agente

### 🚀 Próximas Mejoras (Sugeridas)

1. **Segmentos Avanzados**: Editor con múltiples segmentos
2. **Eventos Especiales**: Medical, Late arrival, Unexpected
3. **Comentarios**: Mostrar tooltips con comentarios
4. **Exportar PDF**: Generar PDF del planning
5. **Drag & Drop**: Arrastrar horarios entre días

### 📝 Notas

- Todos los cambios preservan Excel Safety
- Backward compatible con formato legacy
- Tests pasando al 100%
- Listo para producción
