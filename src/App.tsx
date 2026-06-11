import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Header } from './components/Header';
import { ClickSpark } from './components/ClickSpark';
import { Footer } from './components';
import { Spinner } from './components/Spinner';
import { getWishlistCount } from './utils/wishlist';
import HomePage from './pages/HomePage/HomePage'; // EAGER LOAD for instant Hero

// Lazy load non-critical pages
const ProductsPage = lazy(() => import('./pages/ProductsPage/ProductsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage/ContactPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage/WishlistPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage/ProductDetailPage'));
const DashboardApp = lazy(() => import('./pages/DashboardPage/DashboardApp'));

// Loading fallback component
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--theme-background)'
  }}>
    <Spinner size="md" aria-label="Loading page" />
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  
  const [wishlistCount, setWishlistCount] = useState(0);

  // Check if current route is dashboard
  const isDashboardRoute = location.pathname.startsWith('/dashboard');
  const isHomePage = location.pathname === '/';

  // Get current page from location (exclude dashboard)
  const currentPage = location.pathname.split('/')[1] || 'home';

  // Load wishlist count
  useEffect(() => {
    setWishlistCount(getWishlistCount());

    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      setWishlistCount(getWishlistCount());
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, []);


  // If it's a dashboard route, render dashboard app without main layout
  if (isDashboardRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <DashboardApp />
      </Suspense>
    );
  }

  return (
    <ClickSpark>
      <div className="App">
        <Header 
          currentPage={currentPage} 
          wishlistCount={wishlistCount}
        />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={
            <Suspense fallback={<PageLoader />}>
              <ProductsPage />
            </Suspense>
          } />
          <Route path="/product/:id" element={
            <Suspense fallback={<PageLoader />}>
              <ProductDetailPage />
            </Suspense>
          } />
          <Route path="/contact" element={
            <Suspense fallback={<PageLoader />}>
              <ContactPage />
            </Suspense>
          } />
          <Route path="/wishlist" element={
            <Suspense fallback={<PageLoader />}>
              <WishlistPage />
            </Suspense>
          } />
        </Routes>
        {!isHomePage && <Footer />}
        <SpeedInsights />
      </div>
    </ClickSpark>
  );
};

export default App;
