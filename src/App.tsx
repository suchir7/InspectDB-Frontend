import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportsListPage } from './pages/ReportsListPage';
import { ReportDetailsPage } from './pages/ReportDetailsPage';
import { CreateReportPage } from './pages/CreateReportPage';
import { EditReportPage } from './pages/EditReportPage';
import { AiQueryAssistantPage } from './pages/AiQueryAssistantPage';
import { CostOptimizerPage } from './pages/CostOptimizerPage';
import { CostMonitoringPage } from './pages/CostMonitoringPage';
import { NestedQueryExplorerPage } from './pages/NestedQueryExplorerPage';
import { DatabaseOverviewPage } from './pages/DatabaseOverviewPage';
import { SettingsPage } from './pages/SettingsPage';

// Root route component that displays Landing Page if unauthenticated or allows direct exploration
const RootRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return <LandingPage />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Authentication Routes */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Console Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsListPage />} />
            <Route path="/reports/:reportId" element={<ReportDetailsPage />} />
            <Route path="/create-inspection" element={<CreateReportPage />} />
            <Route path="/edit-inspection/:reportId" element={<EditReportPage />} />
            <Route path="/ai-assistant" element={<AiQueryAssistantPage />} />
            <Route path="/cost-optimizer" element={<CostOptimizerPage />} />
            <Route path="/cost-monitoring" element={<CostMonitoringPage />} />
            <Route path="/nested-query" element={<NestedQueryExplorerPage />} />
            <Route path="/database-overview" element={<DatabaseOverviewPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
