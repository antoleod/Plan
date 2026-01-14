# 🧠 Reglas de Negocio y Configuración

Este documento describe el comportamiento del **Motor de Reglas (Rule Engine)** del sistema. Estas reglas aseguran la equidad en la rotación, garantizan la cobertura operativa y previenen errores humanos durante la planificación.

## ⚙️ Configuración

Las reglas se definen en `server/config/rules.config.json`. Este archivo permite ajustar los umbrales sin modificar el código.

### Estructura Básica

```json
{
  "coverage": { ... },
  "breaks": { ... },
  "rotation": { ... },
  "tardiness": { ... }
}
```

---

## 1. Reglas de Cobertura (Coverage)

El sistema valida en tiempo real si hay suficientes agentes en cada sitio.

### Configuración por Sitio
Cada sitio tiene dos umbrales:
- **Min**: Cantidad mínima crítica. Si baja de este número, se genera una alerta **ROJA (High Severity)**.
- **Target**: Cantidad ideal. Si está entre Min y Target, se genera una alerta **AMARILLA (Warning)**.

**Ejemplo:**
- *WD Spinelli*: Min 2, Target 4.
- *Serv. phone*: Min 1, Target 1.

### Visualización
En el **Manager Copilot**, estas reglas alimentan el *Coverage Board*:
- 🟢 **Verde**: >= Target
- 🟡 **Amarillo**: < Target pero >= Min
- 🔴 **Rojo**: < Min

---

## 2. Reglas de Pausas (Breaks)

El sistema monitorea que las pausas no dejen un sitio desatendido.

### Lógica de Validación
1. Se calcula el personal total asignado a un sitio.
2. Se restan los agentes que están actualmente en estado `Break`.
3. Si el resultado es menor a `minStaffOnSite` (configurado globalmente), se dispara una alerta.

**Objetivo**: Evitar que todos los agentes de un sitio pequeño tomen su pausa simultáneamente.

---

## 3. Reglas de Movimiento (Drag & Drop)

Cuando un Manager intenta mover un turno en la grilla:

1. **Validación de Origen**: ¿Sacar al agente del sitio actual rompe el mínimo de cobertura de ese sitio?
   - Si SÍ: El sistema bloquea el movimiento y muestra un **Override Modal**.
   - El Manager puede forzar el cambio si es necesario, pero queda registrado en el Audit Log.

2. **Validación de Destino**: (Futuro) ¿El agente está cualificado para el sitio destino?

---

## 4. Auditoría y Logs

Aunque el Excel es la fuente de verdad visual, el sistema mantiene un registro detallado de **quién hizo qué y cuándo** en `server/data/audit.log.jsonl`.

Eventos registrados:
- `BATCH_ASSIGN`: Asignación masiva.
- `MOVE_ASSIGNMENT`: Cambios manuales o Drag & Drop.
- `GENERATE_PREPLAN`: Creación automática de meses futuros.
- `ADD_AGENT`: Creación de nuevos perfiles.

Este log es inmutable y exportable a CSV desde el panel de control.