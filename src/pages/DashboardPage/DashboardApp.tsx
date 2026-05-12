import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { Spinner } from '../../components/Spinner';
import './DashboardApp.css';

// Lazy load all dashboard components for better code splitting
const DashboardLogin = lazy(() => import('./DashboardLogin'));
const DashboardLayout = lazy(() => import('./DashboardLayout'));
const DashboardOverview = lazy(() => import('./components/DashboardOverview.tsx'));
const ProductsManagement = lazy(() => import('./components/ProductsManagement.tsx'));
const OrderManagement = lazy(() => import('./components/OrderManagement.tsx'));
const FeaturedManagement = lazy(() => import('./components/FeaturedManagement.tsx'));
const HeroImageManagement = lazy(() => import('./components/HeroImageManagement.tsx'));
const ProductImport = lazy(() => import('./components/ProductImport.tsx'));

// Loading fallback for dashboard components
const DashboardLoader = () => (
  <div className="dashboard-loading">
    <Spinner size="md" aria-label="Loading dashboard" />
    <p>Đang tải...</p>
  </div>
);

// Route Guard Component
const DashboardRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Spinner size="md" aria-label="Authenticating" />
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
    <Suspense fallback={<DashboardLoader />}>
      <Routes>
        {/* Login Route */}
        <Route path="/dashboard" element={<DashboardLogin />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard/*" element={
          <DashboardRouteGuard>
            <Suspense fallback={<DashboardLoader />}>
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
                {/* Orders route */}
                <Route path="orders" element={
                  <DashboardLayout>
                    <OrderManagement />
                  </DashboardLayout>
                } />
                <Route path="featured" element={
                  <DashboardLayout>
                    <FeaturedManagement />
                  </DashboardLayout>
                } />
                <Route path="hero-image" element={
                  <DashboardLayout>
                    <HeroImageManagement />
                  </DashboardLayout>
                } />
                <Route path="import" element={
                  <DashboardLayout>
                    <ProductImport />
                  </DashboardLayout>
                } />
                <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
              </Routes>
            </Suspense>
          </DashboardRouteGuard>
        } />
      </Routes>
    </Suspense>
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