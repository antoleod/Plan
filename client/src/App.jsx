import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Import all pages
import PlanningGrid from './pages/PlanningGrid'; // Assuming ManagerView/AgentView are the grid
import Insights from './pages/Insights';
import AbsenceManager from './pages/AbsenceManager';
import AuditLogs from './pages/AuditLogs';
import Reports from './pages/Reports';
import TeamView from './pages/TeamView';

import './App.css';

const AppRoutes = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {isManager ? (
          <>
            <Route path="/" element={<PlanningGrid />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/absences" element={<AbsenceManager />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/reports" element={<Reports />} />
          </>
        ) : (
          <>
            <Route path="/" element={<PlanningGrid readOnly />} />
            <Route path="/team" element={<TeamView />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}

export default App;
