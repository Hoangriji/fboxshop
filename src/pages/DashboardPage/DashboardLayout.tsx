import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import DashboardSearch from './components/DashboardSearch';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navigation = [
    { name: 'Tổng quan', href: '/dashboard/overview', icon: <i className="fa-solid fa-database"></i> },
    { name: 'Quản lý sản phẩm', href: '/dashboard/products', icon: <i className="fa-solid fa-boxes-stacked"></i> },
    { name: 'Quản lý đơn hàng', href: '/dashboard/orders', icon: <i className="fa-solid fa-receipt"></i> },
    { name: 'Nhập sản phẩm', href: '/dashboard/import', icon: <i className="fa-solid fa-file-import"></i> },
    { name: 'Đồng bộ keyboard Akko', href: '/dashboard/akko-keyboard-update', icon: <i className="fa-solid fa-keyboard"></i> },
    { name: 'Sản phẩm nổi bật', href: '/dashboard/featured', icon: <i className="fa-solid fa-star"></i> },
    { name: 'Hình nền Hero', href: '/dashboard/hero-image', icon: <i className="fa-solid fa-image"></i> },
    { name: 'Lịch sử thao tác', href: '/dashboard/activity-history', icon: <i className="fa-solid fa-clock-rotate-left"></i> },
  ];

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-layout">
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <i className="fa-solid fa-store" style={{ color: '#00d2ff', filter: 'drop-shadow(0 0 8px rgba(0, 210, 255, 0.5))' }}></i>
            <span className="brand-text" style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 800 }}>Fbox Shop</span>
          </h2>
          <span className="admin-badge">Admin</span>
        </div>
        
        <nav className="sidebar-nav">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-item ${location.pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="btn-text">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            {isMobile && (
              <button 
                className="hamburger-btn" 
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            )}
            <h1>Dashboard</h1>
          </div>

          <div className="header-center">
            <DashboardSearch />
          </div>

          <div className="header-right">
            <div className="user-info">
              <i className="fa-solid fa-user-circle"></i>
              <span className="user-name">Admin</span>
            </div>
          </div>
        </header>
        
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;