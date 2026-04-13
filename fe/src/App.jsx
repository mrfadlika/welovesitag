import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/Login/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InputRetasePage from './pages/InputRetase/InputRetasePage';
import RiwayatPage from './pages/Riwayat/RiwayatPage';

// Protected Route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  
  return children;
}

// Redirect based on role
function RoleRedirect() {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Staff & Checker routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['staff_pos', 'checker']}>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/input" element={
        <ProtectedRoute allowedRoles={['staff_pos', 'checker']}>
          <DashboardLayout><InputRetasePage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard/riwayat" element={
        <ProtectedRoute allowedRoles={['staff_pos', 'checker']}>
          <DashboardLayout><RiwayatPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/input" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><InputRetasePage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/riwayat" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <DashboardLayout><RiwayatPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<RoleRedirect />} />
      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
