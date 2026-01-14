import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import ModalShell from './ui/ModalShell';
import './EditDayModal.css';

function EditDayModal({ agent, dayIndex, onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '18:00',
    breakStart: '13:00',
    breakEnd: '14:00',
    status: 'Present',
    site: '',
    comment: ''
  });
  const [palette, setPalette] = useState(null);
  const [errors, setErrors] = useState([]);
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    loadPalette();
    loadTemplates();
  }, []);

  const loadPalette = async () => {
    try {
      const response = await api.get('/planning/palette');
      setPalette(response.data);
    } catch (err) {
      console.error('Error loading palette:', err);
    }
  };

  const loadTemplates = () => {
    setTemplates([
      { start: '08:00', end: '17:00' },
      { start: '08:30', end: '17:30' },
      { start: '09:00', end: '18:00' },
      { start: '09:30', end: '18:30' }
    ]);
  };

  const handleTemplateSelect = (template) => {
    setFormData((prev) => ({
      ...prev,
      startTime: template.start,
      endTime: template.end
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrors([]);
  };

  const calculateEndTime = () => {
    if (formData.startTime && formData.breakStart && formData.breakEnd) {
      const [startH, startM] = formData.startTime.split(':').map(Number);
      const [breakStartH, breakStartM] = formData.breakStart.split(':').map(Number);
      const [breakEndH, breakEndM] = formData.breakEnd.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const breakStartMinutes = breakStartH * 60 + breakStartM;
      const breakEndMinutes = breakEndH * 60 + breakEndM;
      const breakDuration = breakEndMinutes - breakStartMinutes;

      const workMinutes = 8 * 60;
      const totalMinutes = startMinutes + workMinutes + breakDuration;

      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;

      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      handleChange('endTime', endTime);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = [];
    if (formData.startTime < '08:00' || formData.startTime >= '20:00') {
      validationErrors.push('Hora inicio debe estar entre 08:00 y 20:00');
    }
    if (formData.endTime <= formData.startTime) {
      validationErrors.push('Hora fin debe ser posterior a hora inicio');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    await onSave(formData);
  };

  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <ModalShell
      title="Editar Planning"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="flat" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" type="submit" form="edit-day-form" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="modal-info">
        <p>
          <strong>Agente:</strong> {agent.name}
        </p>
        <p>
          <strong>Día:</strong> {dayNames[dayIndex]}
        </p>
      </div>

      {errors.length > 0 && (
        <div className="error-list">
          {errors.map((error, idx) => (
            <div key={idx} className="error-item">
              {error}
            </div>
          ))}
        </div>
      )}

      <form id="edit-day-form" onSubmit={handleSubmit} className="edit-day-form">
        <div className="form-section">
          <h3>Plantillas</h3>
          <div className="template-grid">
            {templates.map((template, idx) => (
              <button
                key={idx}
                type="button"
                className="template-btn"
                onClick={() => handleTemplateSelect(template)}
              >
                {template.start} - {template.end}
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Horario</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Hora inicio</label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                min="08:00"
                max="20:00"
                required
                size="sm"
              />
            </div>
            <div className="form-group">
              <label>Hora fin</label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                min="08:00"
                max="20:00"
                required
                size="sm"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pausa</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Inicio pausa</label>
              <Input
                type="time"
                size="sm"
                value={formData.breakStart}
                onChange={(e) => {
                  handleChange('breakStart', e.target.value);
                  calculateEndTime();
                }}
              />
            </div>
            <div className="form-group">
              <label>Fin pausa</label>
              <Input
                type="time"
                size="sm"
                value={formData.breakEnd}
                onChange={(e) => {
                  handleChange('breakEnd', e.target.value);
                  calculateEndTime();
                }}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Estado</h3>
          <div className="form-group">
            <Select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              size="sm"
            >
              {palette?.status &&
                Object.keys(palette.status).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
            </Select>
          </div>
        </div>

        <div className="form-section">
          <h3>Sitio</h3>
          <div className="form-group">
            <Select value={formData.site} onChange={(e) => handleChange('site', e.target.value)} size="sm">
              <option value="">Seleccionar sitio</option>
              {palette?.sites &&
                Object.keys(palette.sites).map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
            </Select>
          </div>
        </div>

        <div className="form-section">
          <h3>Comentario</h3>
          <div className="form-group">
            <textarea
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              rows={3}
              placeholder="Comentario opcional..."
            />
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

export default EditDayModal;
