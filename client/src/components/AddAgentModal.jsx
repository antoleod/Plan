import { useState, useEffect } from 'react';
import api from '../services/api';
import './AddAgentModal.css';

function AddAgentModal({ onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    function: '',
    defaultSite: ''
  });
  const [palette, setPalette] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    loadPalette();
  }, []);

  const loadPalette = async () => {
    try {
      const response = await api.get('/planning/palette');
      setPalette(response.data);
    } catch (err) {
      console.error('Error loading palette:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    setErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrors(['El nombre es obligatorio']);
      return;
    }
    
    setErrors([]);
    try {
      await onSave(formData);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Error al añadir agente';
      setErrors([errorMsg]);
      console.error('Add agent error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Añadir Agente</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {errors.length > 0 && (
            <div className="error-list">
              {errors.map((error, idx) => (
                <div key={idx} className="error-item">{error}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-group">
                <label>Nombre y Apellido *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: DIOSES Juan"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Función</label>
                <input
                  type="text"
                  value={formData.function}
                  onChange={(e) => handleChange('function', e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Site por Defecto</label>
                <select
                  value={formData.defaultSite}
                  onChange={(e) => handleChange('defaultSite', e.target.value)}
                >
                  <option value="">Ninguno</option>
                  {palette?.sites && Object.keys(palette.sites).map((site) => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Añadiendo...' : 'Añadir Agente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddAgentModal;
