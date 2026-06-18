import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Typography } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import theme from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ClientDashboardPage } from './pages/dashboard/ClientDashboardPage';
import { TrainerDashboardPage } from './pages/dashboard/TrainerDashboardPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { TrainersPage } from './pages/trainers/TrainersPage';
import { GroupsPage } from './pages/groups/GroupsPage';
import { SchedulePage } from './pages/schedule/SchedulePage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage';
import { PaymentsPage } from './pages/payments/PaymentsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, refetchOnWindowFocus: true, retry: 1 },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
};

const RoleDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') return <DashboardPage />;
  if (user?.role === 'TRAINER') return <TrainerDashboardPage />;
  return <ClientDashboardPage />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (user?.role !== 'ADMIN') return <Navigate to="/" />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<RoleDashboard />} />
        <Route path="clients" element={<AdminRoute><ClientsPage /></AdminRoute>} />
        <Route path="trainers" element={<AdminRoute><TrainersPage /></AdminRoute>} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="payments" element={<AdminRoute><PaymentsPage /></AdminRoute>} />
        <Route path="reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
