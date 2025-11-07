
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MaterialsPage from './pages/MaterialsPage';
import MovementsPage from './pages/MovementsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import AiChatPage from './pages/AiChatPage';

const ProtectedRoute: React.FC<{ children: React.ReactElement; roles: Role[] }> = ({ children, roles }) => {
  const auth = useAuth();
  if (!auth.user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(auth.user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppRoutes: React.FC = () => {
    const auth = useAuth();

    if (!auth.user) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Layout>
            <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/movements" element={<MovementsPage />} />
                <Route path="/ai-chat" element={<AiChatPage />} />
                <Route path="/reports" element={
                    <ProtectedRoute roles={[Role.Gerente]}>
                        <ReportsPage />
                    </ProtectedRoute>
                } />
                <Route path="/users" element={
                    <ProtectedRoute roles={[Role.Gerente]}>
                        <UsersPage />
                    </ProtectedRoute>
                } />
                <Route path="/audit" element={
                    <ProtectedRoute roles={[Role.Gerente]}>
                        <AuditPage />
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Layout>
    );
};

function App() {
  return (
    <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AuthProvider>
  );
}

export default App;