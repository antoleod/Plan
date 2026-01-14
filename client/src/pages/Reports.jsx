import React from 'react';

const Reports = () => {
  return (
    <div className="p-8 bg-[#F1F5F9] min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#002244] mb-2">Reports & Exports</h1>
        <p className="text-slate-600 mb-8">Download official timesheet data and audit logs.</p>

        <div className="bg-white shadow-sm rounded-lg border border-slate-200 divide-y divide-slate-200">
          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[#003399]">Monthly Planning (Excel)</h3>
              <p className="text-sm text-slate-500">Full editable Excel file with all macros and formats preserved.</p>
            </div>
            <button 
              onClick={() => window.open('/api/excel/download', '_blank')}
              className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              Download .xlsm
            </button>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[#003399]">Audit Log (CSV)</h3>
              <p className="text-sm text-slate-500">Complete history of all modifications made by managers.</p>
            </div>
            <button 
              onClick={() => window.open('/api/reports/export/csv', '_blank')}
              className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;