import { StrictMode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './components/shared/Notification';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import LoginPage from './components/LoginPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import { CompanyAdminDashboard } from './components/CompanyAdmin/CompanyAdminDashboard';
import TeamInchargeDashboard from './components/TeamIncharge';
import TelecallerDashboard from './components/TelecallerDashboard/index';

const getDashboardPath = (role?: string) => {
  switch (role) {
    case 'SuperAdmin': return '/superadmin';
    case 'CompanyAdmin': return '/companyadmin';
    case 'TeamIncharge': return '/teamincharge';
    case 'Telecaller': return '/telecaller';
    default: return '/login';
  }
};

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Navigate to={getDashboardPath(user?.role)} replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="/superadmin"
          element={
            isAuthenticated && user?.role === 'SuperAdmin' ? (
              <SuperAdminDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/companyadmin"
          element={
            isAuthenticated && (user?.role === 'CompanyAdmin' || user?.role === 'SuperAdmin') ? (
              <CompanyAdminDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/teamincharge"
          element={
            isAuthenticated && ['TeamIncharge', 'CompanyAdmin', 'SuperAdmin'].includes(user?.role || '') ? (
              <TeamInchargeDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/telecaller"
          element={
            isAuthenticated ? (
              <TelecallerDashboard user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <NotificationProvider>
          <ConfirmationProvider>
            <AppContent />
          </ConfirmationProvider>
        </NotificationProvider>
      </AuthProvider>
    </StrictMode>
  );
}

export default App;