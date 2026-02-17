import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import DashboardLogin from './DashboardLogin';
import DashboardLayout from './DashboardLayout';
import DashboardOverview from './components/DashboardOverview.tsx';
import ProductsManagement from './components/ProductsManagement.tsx';
import FeaturedManagement from './components/FeaturedManagement.tsx';
import './DashboardApp.css';

// Route Guard Component
const DashboardRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Đang xác thực...</p>
      </div>
    );
  }

  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated && location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and on login page, redirect to overview
  if (isAuthenticated && location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/overview" replace />;
  }

  return <>{children}</>;
};

// Dashboard Routes Component
const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/dashboard" element={<DashboardLogin />} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard/*" element={
        <DashboardRouteGuard>
          <Routes>
            <Route path="overview" element={
              <DashboardLayout>
                <DashboardOverview />
              </DashboardLayout>
            } />
            <Route path="products" element={
              <DashboardLayout>
                <ProductsManagement />
              </DashboardLayout>
            } />
            <Route path="featured" element={
              <DashboardLayout>
                <FeaturedManagement />
              </DashboardLayout>
            } />
            <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
          </Routes>
        </DashboardRouteGuard>
      } />
    </Routes>
  );
};

// Main Dashboard App Component
const DashboardApp: React.FC = () => {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div className="dashboard-app">
      <DashboardRoutes />
      <SpeedInsights />
    </div>
  );
};

export default DashboardApp;