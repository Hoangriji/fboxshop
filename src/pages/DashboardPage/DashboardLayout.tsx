import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ActivityLogsService } from '../../services/activityLogsService';
import { AnimatedList } from '../../components/AnimatedList';
import type { ActivityLog } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const navigation = [
    { name: 'Tổng quan', href: '/dashboard/overview', icon: <i className="fa-solid fa-database"></i> },
    { name: 'Quản lý sản phẩm', href: '/dashboard/products', icon: <i className="fa-solid fa-boxes-stacked"></i> },
    { name: 'Sản phẩm nổi bật', href: '/dashboard/featured', icon: <i className="fa-solid fa-star"></i> },
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

  // Subscribe to activity logs
  useEffect(() => {
    const unsubscribe = ActivityLogsService.subscribeToLogs(50, (logs) => {
      setActivityLogs(logs);
    });

    return () => unsubscribe();
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-dropdown') && !target.closest('.notification-btn')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const getActivityStyle = (action: string) => {
    switch (action) {
      case 'create':
        return { color: '#10b981', icon: 'fa-plus-circle', text: 'Th\u00eam m\u1edbi' };
      case 'update':
        return { color: '#3b82f6', icon: 'fa-edit', text: 'C\u1eadp nh\u1eadt' };
      case 'delete':
        return { color: '#ef4444', icon: 'fa-trash-alt', text: 'X\u00f3a' };
      case 'feature':
        return { color: '#f59e0b', icon: 'fa-star', text: '\u0110\u1eb7t n\u1ed5i b\u1eadt' };
      case 'unfeature':
        return { color: '#6b7280', icon: 'fa-star-half-alt', text: 'B\u1ecf n\u1ed5i b\u1eadt' };
      default:
        return { color: '#a855f7', icon: 'fa-info-circle', text: 'Th\u00f4ng b\u00e1o' };
    }
  };

  const formatTimestamp = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'V\u1eeba xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} ph\u00fat tr\u01b0\u1edbc`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} gi\u1edd tr\u01b0\u1edbc`;
    return `${Math.floor(diff / 86400)} ng\u00e0y tr\u01b0\u1edbc`;
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
            <i className="fa-solid fa-store"></i>
            <span className="brand-text">Uside Shop</span>
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
          <div className="header-right">
            {/* Notification Button */}
            <div className="notification-wrapper">
              <button 
                className="notification-btn" 
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <i className="fa-solid fa-bell"></i>
                {activityLogs.length > 0 && (
                  <span className="notification-badge">{activityLogs.length}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>
                      <i className="fas fa-bell"></i>
                      Hoạt động gần đây
                    </h3>
                    <span className="notification-count">{activityLogs.length} thông báo</span>
                  </div>
                  <div className="notification-list">
                    {activityLogs && activityLogs.length > 0 ? (
                      <AnimatedList<ActivityLog>
                        items={activityLogs}
                        showGradients={false}
                        enableArrowNavigation={false}
                        displayScrollbar={true}
                        itemClassName="notification-item"
                        renderItem={(log: ActivityLog) => {
                          const style = getActivityStyle(log.action);
                          return (
                            <div className="notification-content">
                              <div className="notification-icon-wrapper" style={{ backgroundColor: `${style.color}20` }}>
                                <i className={`fas ${style.icon}`} style={{ color: style.color }}></i>
                              </div>
                              <div className="notification-details">
                                <div className="notification-text">
                                  <span className="notification-action" style={{ color: style.color }}>
                                    {style.text}
                                  </span>
                                  <span className="notification-time">{formatTimestamp(log.timestamp)}</span>
                                </div>
                                <p className="notification-product">{log.productName}</p>
                                {log.details && <span className="notification-desc">{log.details}</span>}
                              </div>
                            </div>
                          );
                        }}
                      />
                    ) : (
                      <div className="notification-empty">
                        <i className="fas fa-inbox"></i>
                        <p>Chưa có hoạt động nào</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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