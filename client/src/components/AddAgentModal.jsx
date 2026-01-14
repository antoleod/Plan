import { useState, useEffect } from 'react';
import api from '../services/api';
import './AddAgentModal.css';

function AddAgentModal({ onSave, onClose, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setErrors([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setErrors(['Name is required']);
      return;
    }

    try {
      await onSave(formData);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to add agent';
      setErrors([errorMsg]);
      console.error('Add agent error:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Agent</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {errors.length > 0 && (
            <div className="error-list">
              {errors.map((error, index) => (
                <div key={index} className="error-item">{error}</div>
              ))}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <div className="form-group">
                <label>Full name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="e.g. DIOSES Juan"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(event) => handleChange('role', event.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="form-section">
              <div className="form-group">
                <label>Default site</label>
                <select
                  value={formData.defaultSite}
                  onChange={(event) => handleChange('defaultSite', event.target.value)}
                >
                  <option value="">None</option>
                  {palette?.sites && Object.keys(palette.sites).map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Adding...' : 'Add Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddAgentModal;
