# 🚀 Iniciar la Aplicación

## Inicio Rápido

### Opción 1: Iniciar todo junto (Recomendado)

```bash
npm run dev
```

Esto iniciará:
- ✅ Backend en `http://localhost:3001`
- ✅ Frontend en `http://localhost:3000`

### Opción 2: Iniciar por separado

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Acceder a la Aplicación

1. Abre tu navegador en: **http://localhost:3000**

2. **Login como Manager:**
   - Usuario: `manager`
   - Contraseña: `manager123`

3. **Login como Agent (solo lectura):**
   - Usuario: `juan`
   - Contraseña: `juan123`

## Verificar que Funciona

### Backend funcionando:
- Abre: http://localhost:3001/api/auth/verify
- Deberías ver un error de autenticación (eso es normal sin token)

### Frontend funcionando:
- Abre: http://localhost:3000
- Deberías ver la página de login

## Hacer Modificaciones como Manager

1. **Login como manager** (`manager` / `manager123`)

2. **Ver planning completo:**
   - Verás todos los agentes y sus planning
   - Tabla con filas = agentes, columnas = días

3. **Editar planning:**
   - Haz click en cualquier celda (Agente × Día)
   - Se abrirá un modal de edición
   - Selecciona:
     - Plantilla de turno (08:00-17:00, etc.)
     - Hora inicio y fin
     - Pausa (inicio y fin)
     - Estado (Present, Telework, Mission, etc.)
     - Sitio (WD Spinelli, WD Kohl, etc.)
     - Comentario (opcional)
   - Click en "Guardar"

4. **Los cambios se guardan automáticamente:**
   - Se actualiza el Excel
   - Se crea un backup automático
   - Los cambios persisten en el archivo Excel

5. **Descargar Excel actualizado:**
   - Click en botón "Descargar Excel"
   - Obtendrás el archivo con todos los cambios

## Características Importantes

### ✅ Auto-save
- Los cambios se guardan automáticamente al hacer click en "Guardar"
- No necesitas guardar manualmente

### ✅ Detección de Conflictos
- Si el Excel fue modificado externamente, verás una alerta
- Puedes recargar para obtener los últimos cambios

### ✅ Backups Automáticos
- Antes de cada guardado se crea un backup
- Archivos: `Planning_2026-01_FULLY_EDITABLE_backup_TIMESTAMP.xlsm`

### ✅ Preservación de Formato
- Los colores se copian desde el Excel (no se inventan)
- Las fórmulas se preservan
- La estructura no se modifica

## Troubleshooting

### Error: "Excel file not found"
- Verifica que `Planning_2026-01_FULLY_EDITABLE.xlsm` está en la raíz del proyecto
- Verifica la ruta en `server/routes/excel.js`

### Error: "Sheet 'Planning' not found"
- Verifica el nombre de la hoja en `server/config/mapping.config.json`
- Asegúrate de que el Excel tiene una hoja con ese nombre

### Error: "Agent not found"
- Verifica la configuración en `server/config/mapping.config.json`
- Ajusta `agentNameColumn` y `agentStartRow` según tu Excel

### El servidor no inicia
- Verifica que el puerto 3001 (backend) y 3000 (frontend) estén libres
- Cierra otras aplicaciones que usen esos puertos

### Los cambios no se guardan
- Verifica que tienes permisos de escritura en el archivo Excel
- Verifica que el archivo no está abierto en Excel
- Revisa la consola del navegador para errores

## Próximos Pasos

1. ✅ Iniciar aplicación (`npm run dev`)
2. ✅ Login como manager
3. ✅ Probar edición de planning
4. ✅ Verificar que los cambios se guardan en el Excel
5. ✅ Descargar Excel y verificar formato preservado
