import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CoverageWidget from './CoverageWidget';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isManager = user?.role === 'manager';

  const NavItem = ({ to, icon, label }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
          isActive
            ? 'bg-[#0044CC] border-[#2DD4BF] text-white'
            : 'border-transparent text-blue-100 hover:bg-[#002244] hover:text-white'
        }`}
      >
        <span className={`mr-3 text-lg ${isActive ? 'text-[#2DD4BF]' : 'text-blue-300'}`}>
          {icon}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#003399] text-white flex flex-col shadow-2xl z-50 font-sans">
      {/* Header */}
      <div className="p-6 bg-[#002244] border-b border-blue-900">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[#2DD4BF] rounded-sm flex items-center justify-center text-[#002244] font-bold text-xs">
            EU
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-tight">Planning App</h1>
            <p className="text-[10px] text-blue-300 uppercase tracking-wider">Official Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 space-y-1">
        {isManager ? (
          <>
            <div className="px-4 mb-2 text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-80">
              Management
            </div>
            <NavItem to="/" icon="📅" label="Planning Grid" />
            <NavItem to="/insights" icon="📊" label="Coverage Dashboard" />
            <NavItem to="/absences" icon="🏥" label="Absence Manager" />
            <NavItem to="/audit" icon="🛡️" label="Audit Logs" />
            <NavItem to="/reports" icon="📑" label="Reports Export" />
            <CoverageWidget />
          </>
        ) : (
          <>
            <div className="px-4 mb-2 text-[10px] font-bold text-blue-300 uppercase tracking-widest opacity-80">
              My Workspace
            </div>
            <NavItem to="/" icon="📅" label="My Schedule" />
            <NavItem to="/team" icon="👥" label="Team View" />
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 bg-[#002244] border-t border-blue-900">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-800 border border-blue-600 flex items-center justify-center text-xs font-medium">
            {user?.username?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.username || user?.name}</p>
            <p className="text-xs text-[#2DD4BF] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full py-2 px-4 bg-blue-900 hover:bg-red-900 text-xs font-medium rounded transition-colors text-blue-100 hover:text-white border border-blue-800"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;