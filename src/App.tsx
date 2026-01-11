import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Header } from './components/Header';
import { ScrollToTop } from './components/ScrollToTop';
import { ClickSpark } from './components/ClickSpark';
import { Footer } from './components';
import { getWishlistCount } from './utils/wishlist';
import { useProductStore } from './store/productStore';
import HomePage from './pages/HomePage/HomePage'; // EAGER LOAD for instant Hero
import './styles/global.css';

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
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid var(--theme-border)',
      borderTop: '3px solid var(--accent-primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

const App: React.FC = () => {
  const location = useLocation();
  
  // Load accent color from localStorage or use default
  const [currentAccentColor, setCurrentAccentColor] = useState(() => {
    const saved = localStorage.getItem('accentColor');
    return saved || '#00d2ff';
  });
  
  const [wishlistCount, setWishlistCount] = useState(0);
  const { loadProducts } = useProductStore();

  // Save accent color to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('accentColor', currentAccentColor);
  }, [currentAccentColor]);

  // Check if current route is dashboard
  const isDashboardRoute = location.pathname.startsWith('/dashboard');

  // Get current page from location (exclude dashboard)
  const currentPage = location.pathname.split('/')[1] || 'home';

  // Load products from Firebase on app start
  useEffect(() => {
    if (!isDashboardRoute) {
      loadProducts();
    }
  }, [loadProducts, isDashboardRoute]);

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

  // Update CSS variables when accent color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', currentAccentColor);
  }, [currentAccentColor]);

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
          currentAccentColor={currentAccentColor}
          setCurrentAccentColor={setCurrentAccentColor}
        />
        <ScrollToTop />
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
        <Footer />
        <SpeedInsights />
      </div>
    </ClickSpark>
  );
};

export default App;
