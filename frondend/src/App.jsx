import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/useAuth';
import LoginPage from './pages/Login/LoginPage';
import DashboardLayout from './components/Layout/DashboardLayout';
import DashboardPage from './pages/Dashboard/DashboardPage';
import InputRetasePage from './pages/InputRetase/InputRetasePage';
import ExitVerificationPage from './pages/ExitVerification/ExitVerificationPage';
import RiwayatPage from './pages/Riwayat/RiwayatPage';
import RekapPage from './pages/Rekap/RekapPage';
import KelolaPenggunaPage from './pages/KelolaPengguna/KelolaPenggunaPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'checker'
          ? '/checker'
          : '/staff';

    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'checker') {
    return <Navigate to="/checker" replace />;
  }

  return <Navigate to="/staff" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/staff"
        element={(
          <ProtectedRoute allowedRoles={['staff_pos']}>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/staff/input"
        element={(
          <ProtectedRoute allowedRoles={['staff_pos']}>
            <Navigate to="/staff/verifikasi" replace />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/staff/verifikasi"
        element={(
          <ProtectedRoute allowedRoles={['staff_pos']}>
            <DashboardLayout>
              <ExitVerificationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/staff/riwayat"
        element={(
          <ProtectedRoute allowedRoles={['staff_pos']}>
            <DashboardLayout>
              <RiwayatPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/staff/rekap"
        element={(
          <ProtectedRoute allowedRoles={['staff_pos']}>
            <DashboardLayout>
              <RekapPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/checker"
        element={(
          <ProtectedRoute allowedRoles={['checker']}>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/checker/input"
        element={(
          <ProtectedRoute allowedRoles={['checker']}>
            <DashboardLayout>
              <InputRetasePage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/checker/riwayat"
        element={(
          <ProtectedRoute allowedRoles={['checker']}>
            <DashboardLayout>
              <RiwayatPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/checker/rekap"
        element={(
          <ProtectedRoute allowedRoles={['checker']}>
            <DashboardLayout>
              <RekapPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/input"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <InputRetasePage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/input-checker"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <InputRetasePage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/input-staff"
        element={<Navigate to="/admin/input" replace />}
      />
      <Route
        path="/admin/verifikasi"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <ExitVerificationPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/riwayat"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <RiwayatPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/rekap"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <RekapPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />
      <Route
        path="/admin/pengguna"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <KelolaPenggunaPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      />

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
