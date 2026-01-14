import React from 'react';

const AbsenceManager = () => {
  return (
    <div className="p-8 bg-[#F1F5F9] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-[#002244]">Absence Manager</h1>
          <button className="px-4 py-2 bg-[#003399] text-white text-sm font-medium rounded shadow-sm hover:bg-[#002244]">
            + New Absence Request
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {['Sick Leave', 'Holiday', 'Mission'].map((type) => (
            <div key={type} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">{type}</h3>
              <p className="mt-2 text-3xl font-bold text-[#002244]">0</p>
              <p className="text-xs text-slate-400 mt-1">Active today</p>
            </div>
          ))}
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">Select a range in the Planning Grid to assign absences or use the button above.</p>
        </div>
      </div>
    </div>
  );
};

export default AbsenceManager;