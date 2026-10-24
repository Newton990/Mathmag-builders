import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffLayout } from './layouts/StaffLayout';
import { FieldLayout } from './layouts/FieldLayout';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/LoginPage';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { FieldDashboardPage } from './pages/field/FieldDashboardPage';
import { ClientPortalPage } from './pages/portal/ClientPortalPage';

export default function App() {
  return (
    <Routes>
      {/* Default redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />

      {/* Staff dashboard — desktop-first, role-based */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route index element={<StaffDashboardPage />} />
      </Route>

      {/* Field officer — mobile-first, offline-capable PWA */}
      <Route path="/field" element={<FieldLayout />}>
        <Route index element={<FieldDashboardPage />} />
      </Route>

      {/* Client portal — mobile-friendly, published content only */}
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<ClientPortalPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
