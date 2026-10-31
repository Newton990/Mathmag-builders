import { Routes, Route, Navigate } from 'react-router-dom';
import { StaffLayout } from './layouts/StaffLayout';
import { FieldLayout } from './layouts/FieldLayout';
import { PortalLayout } from './layouts/PortalLayout';
import { LoginPage } from './pages/LoginPage';
import { RequireRole } from './components/Guards';
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { StaffInboxPage } from './pages/staff/StaffInboxPage';
import { StaffConversationPage } from './pages/staff/StaffConversationPage';
import { StaffConfirmBookingPage } from './pages/staff/StaffConfirmBookingPage';
import { StaffProjectsPage } from './pages/staff/StaffProjectsPage';
import { StaffProjectPage } from './pages/staff/StaffProjectPage';
import { StaffReportsPage } from './pages/staff/StaffReportsPage';
import { StaffReportPage } from './pages/staff/StaffReportPage';
import { StaffPlanningPage } from './pages/staff/StaffPlanningPage';
import { StaffAcceptancePage } from './pages/staff/StaffAcceptancePage';
import { StaffApprovalsPage } from './pages/staff/StaffApprovalsPage';
import { StaffContractsPage } from './pages/staff/StaffContractsPage';
import { StaffConstructionPage } from './pages/staff/StaffConstructionPage';
import { FieldDashboardPage } from './pages/field/FieldDashboardPage';
import { FieldVisitPage } from './pages/field/FieldVisitPage';
import { FieldSurveyPage } from './pages/field/FieldSurveyPage';
import { ClientPortalPage } from './pages/portal/ClientPortalPage';
import { ClientProjectPage } from './pages/portal/ClientProjectPage';

const STAFF_ROLES = [
  'ADMIN_MANAGEMENT',
  'LEAD_ARCHITECT',
  'CLIENT_RELATIONS_OFFICER',
  'VISITING_OFFICER',
  'JUNIOR_ARCHITECT',
] as const;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/staff"
        element={
          <RequireRole roles={[...STAFF_ROLES]}>
            <StaffLayout />
          </RequireRole>
        }
      >
        <Route index element={<StaffDashboardPage />} />
        <Route path="inbox" element={<StaffInboxPage />} />
        <Route path="inbox/:id" element={<StaffConversationPage />} />
        <Route path="bookings/confirm" element={<StaffConfirmBookingPage />} />
        <Route path="projects" element={<StaffProjectsPage />} />
        <Route path="projects/:id" element={<StaffProjectPage />} />
        <Route path="projects/:id/planning" element={<StaffPlanningPage />} />
        <Route path="projects/:id/acceptance" element={<StaffAcceptancePage />} />
        <Route path="projects/:id/approvals" element={<StaffApprovalsPage />} />
        <Route path="projects/:id/contracts" element={<StaffContractsPage />} />
        <Route path="projects/:id/construction" element={<StaffConstructionPage />} />
        <Route path="reports" element={<StaffReportsPage />} />
        <Route path="reports/:id" element={<StaffReportPage />} />
      </Route>

      <Route
        path="/field"
        element={
          <RequireRole roles={['VISITING_OFFICER', 'LEAD_ARCHITECT', 'ADMIN_MANAGEMENT']}>
            <FieldLayout />
          </RequireRole>
        }
      >
        <Route index element={<FieldDashboardPage />} />
        <Route path="visits/:id" element={<FieldVisitPage />} />
        <Route path="surveys/:id" element={<FieldSurveyPage />} />
      </Route>

      <Route
        path="/portal"
        element={
          <RequireRole roles={['CLIENT']}>
            <PortalLayout />
          </RequireRole>
        }
      >
        <Route index element={<ClientPortalPage />} />
        <Route path="projects/:id" element={<ClientProjectPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
