import React, { useState, useEffect } from 'react';

const EditDaySlideOver = ({ isOpen, onClose, data, onSave, isManager }) => {
  const [formData, setFormData] = useState({
    site: '',
    startTime: '',
    endTime: '',
    status: 'Present',
    reason: ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        site: data.site || '',
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        status: data.status || 'Present',
        reason: ''
      });
    }
  }, [data]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex pointer-events-none">
        <div className="w-screen max-w-md pointer-events-auto">
          <div className="h-full flex flex-col bg-white shadow-2xl">
            
            {/* Header */}
            <div className="px-6 py-6 bg-[#003399] text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" id="slide-over-title">Edit Assignment</h2>
                <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors">
                  <span className="sr-only">Close panel</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 text-sm text-blue-100 flex justify-between">
                <span>{data?.agentName}</span>
                <span className="font-mono bg-[#002244] px-2 py-0.5 rounded text-xs">{data?.date}</span>
              </div>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col bg-[#F1F5F9]">
              <div className="flex-1 px-6 py-6 overflow-y-auto space-y-6">
                
                {/* Status Section */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-[#003399] focus:border-[#003399] rounded-md"
                  >
                    <option value="Present">Present</option>
                    <option value="Telework">Telework</option>
                    <option value="Mission">Mission</option>
                    <option value="Sick">Sick Leave</option>
                    <option value="Holiday">Holiday</option>
                    <option value="OFF">OFF</option>
                  </select>
                </div>

                {/* Schedule Section */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule & Location</label>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Site / Location</label>
                    <input
                      type="text"
                      value={formData.site}
                      onChange={e => setFormData({...formData, site: e.target.value})}
                      className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#003399] focus:border-[#003399] sm:text-sm py-2"
                      placeholder="e.g. WD Spinelli"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Start</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#003399] focus:border-[#003399] sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">End</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={e => setFormData({...formData, endTime: e.target.value})}
                        className="block w-full border-slate-300 rounded-md shadow-sm focus:ring-[#003399] focus:border-[#003399] sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Audit Section (Mandatory for Managers) */}
                {isManager && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                      Audit Trail <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.reason}
                      onChange={e => setFormData({...formData, reason: e.target.value})}
                      className="block w-full border-amber-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-white"
                      placeholder="Reason for this modification..."
                    />
                    <p className="mt-1 text-xs text-amber-700">This reason will be permanently logged.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003399]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#003399] border border-transparent rounded-md hover:bg-[#002244] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#003399] shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditDaySlideOver;