import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './layouts/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MustahiqList } from './pages/Mustahiq';
import { MustahiqDetail } from './pages/MustahiqDetail';
import { ZakatMasukList } from './pages/ZakatMasuk';
import { ZakatKeluarList } from './pages/ZakatKeluar';
import { MuzakkiList } from './pages/Muzakki';
import { UserManagement } from './pages/UserManagement';
import { ZoneManagement } from './pages/ZoneManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Requires specific roles */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PEMBAGI', 'MUZAKKI']} />}>
                <Route path="/mustahiq" element={<MustahiqList />} />
                <Route path="/mustahiq/:id" element={<MustahiqDetail />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'PEMBAGI']} />}>
                <Route path="/zakat-keluar" element={<ZakatKeluarList />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/muzakki" element={<MuzakkiList />} />
                <Route path="/zakat-masuk" element={<ZakatMasukList />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/zones" element={<ZoneManagement />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
