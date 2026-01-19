import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { ActivityLogsService } from '../../../services/activityLogsService';
import { AnimatedList } from '../../../components/AnimatedList';
import type { Product, Category, ActivityLog } from '../../../types';

interface CategoryDistribution {
  name: string;
  count: number;
  color: string;
  percentage: number;
  icon: string;
}

const DashboardOverview: React.FC = () => {
  const { products } = useProducts();
  const { categories } = useCategories();
  const [hoveredSegment, setHoveredSegment] = useState<CategoryDistribution | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    digitalFreeProducts: 0,
    totalCategories: 0,
    recentProducts: 0
  });

  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);

  useEffect(() => {
    if (products) {
      const digitalFeatured = products.filter((p: Product) => p.type === 'digital' && p.featured).length;
      const recent = products.filter((p: Product) => {
        const createdAt = new Date(p.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length;

      setStats({
        totalProducts: products.length,
        digitalFreeProducts: digitalFeatured,
        totalCategories: categories?.length || 0,
        recentProducts: recent
      });

      // Calculate category distribution
      if (categories) {
        const colors = [
          '#00d2ff', '#a855f7', '#ec4899', '#10b981', 
          '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'
        ];
        
        const distribution = categories.map((cat: Category, index: number) => {
          const count = products.filter((p: Product) => p.category === cat.id).length;
          const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
          
          return {
            name: cat.name,
            count,
            color: colors[index % colors.length],
            percentage,
            icon: cat.icon || 'fa-box'
          };
        }).filter((cat) => cat.count > 0);

        setCategoryDistribution(distribution);
      }
    }
  }, [products, categories]);

  // Subscribe to activity logs
  useEffect(() => {
    const unsubscribe = ActivityLogsService.subscribeToLogs(100, (logs) => {
      setActivityLogs(logs);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get activity icon and color
  const getActivityStyle = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
        return { icon: 'fa-plus-circle', color: '#10b981', text: 'Thêm mới' };
      case 'update':
        return { icon: 'fa-edit', color: '#00d2ff', text: 'Cập nhật' };
      case 'delete':
        return { icon: 'fa-trash', color: '#ef4444', text: 'Xóa' };
      case 'feature':
        return { icon: 'fa-star', color: '#f59e0b', text: 'Đặt nổi bật' };
      case 'unfeature':
        return { icon: 'fa-star-half-alt', color: '#6b7280', text: 'Bỏ nổi bật' };
      default:
        return { icon: 'fa-circle', color: '#6b7280', text: 'Khác' };
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="dashboard-overview">
      {/* Welcome Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1 className="welcome-title">Chào mừng đến với Dashboard</h1>
          <p className="welcome-subtitle">Quản lý sản phẩm và danh mục của bạn</p>
        </div>
        <div className="welcome-time">
          <span className="time-badge">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="overview-stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Tổng sản phẩm</h3>
            <p className="stat-number">{stats.totalProducts}</p>
            <span className="stat-change positive">
              <i className="fas fa-arrow-up"></i> {stats.recentProducts} mới trong tuần
            </span>
          </div>
          <div className="stat-bg-icon">
            <i className="fas fa-box"></i>
          </div>
        </div>
        
        <div className="stat-card stat-card-accent">
          <div className="stat-icon">
            <i className="fas fa-gift"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Digital miễn phí</h3>
            <p className="stat-number">{stats.digitalFreeProducts}</p>
            <span className="stat-change">
            </span>
          </div>
          <div className="stat-bg-icon">
            <i className="fas fa-gift"></i>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Danh mục</h3>
            <p className="stat-number">{stats.totalCategories}</p>
            <span className="stat-change">
              {categoryDistribution.length} có sản phẩm
            </span>
          </div>
          <div className="stat-bg-icon">
            <i className="fas fa-layer-group"></i>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Category Distribution Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <i className="fas fa-chart-pie"></i>
              Phân bố theo danh mục
            </h3>
            <span className="chart-badge">{stats.totalProducts} sản phẩm</span>
          </div>
          <div className="chart-content">
            {categoryDistribution.length > 0 ? (
              <>
                <div className="donut-chart">
                  <svg viewBox="0 0 240 240" className="donut-svg">
                    {/* Background circle */}
                    <circle 
                      cx="120" 
                      cy="120" 
                      r="80" 
                      fill="none" 
                      stroke="var(--theme-bg-tertiary)" 
                      strokeWidth="40" 
                    />
                    {/* Category segments */}
                    {categoryDistribution.reduce((acc, cat) => {
                      const total = categoryDistribution.reduce((sum, c) => sum + c.percentage, 0);
                      const normalizedPercentage = (cat.percentage / total) * 100;
                      const circumference = 2 * Math.PI * 80;
                      const offset = acc.offset;
                      const strokeDasharray = `${(normalizedPercentage / 100) * circumference} ${circumference}`;
                      
                      acc.elements.push(
                        <g key={cat.name}>
                          <circle
                            cx="120"
                            cy="120"
                            r="80"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="42"
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 120 120)"
                            className="donut-segment"
                            style={{ 
                              filter: `drop-shadow(0 0 6px ${cat.color}60)`,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={() => setHoveredSegment(cat)}
                            onMouseLeave={() => setHoveredSegment(null)}
                          />
                        </g>
                      );
                      
                      acc.offset += (normalizedPercentage / 100) * circumference;
                      return acc;
                    }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
                  </svg>
                  <div className="donut-center">
                    {hoveredSegment ? (
                      <>
                        <i className={`fas ${hoveredSegment.icon} donut-icon`} style={{ color: hoveredSegment.color }}></i>
                        <span className="donut-category">{hoveredSegment.name}</span>
                        <span className="donut-count">{hoveredSegment.count}</span>
                        <span className="donut-percentage">{hoveredSegment.percentage.toFixed(1)}%</span>
                      </>
                    ) : (
                      <>
                        <span className="donut-total">{stats.totalProducts}</span>
                        <span className="donut-label">SẢN PHẨM</span>
                      </>
                    )}
                  </div>
                </div>
                {/* Chart Legend */}
                <div className="chart-legend">
                  {categoryDistribution.map((cat) => (
                    <div 
                      key={cat.name} 
                      className="legend-item"
                      onMouseEnter={() => setHoveredSegment(cat)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      <div className="legend-color" style={{ backgroundColor: cat.color }}>
                        <i className={`fas ${cat.icon}`}></i>
                      </div>
                      <div className="legend-info">
                        <span className="legend-name">{cat.name}</span>
                        <span className="legend-stats">{cat.count} sản phẩm ({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-chart">
                <i className="fas fa-chart-pie"></i>
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="chart-card activity-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <i className="fas fa-bell"></i>
              Hoạt động gần đây
            </h3>
            <span className="chart-badge">{activityLogs.length} thông báo</span>
          </div>
          <div className="chart-content">
            <div className="activity-list">
              {activityLogs && activityLogs.length > 0 ? (
                <AnimatedList<ActivityLog>
                  items={activityLogs}
                  showGradients={true}
                  enableArrowNavigation={false}
                  displayScrollbar={true}
                  itemClassName="dashboard-activity-item"
                  renderItem={(log: ActivityLog) => {
                    const style = getActivityStyle(log.action);
                    return (
                      <div className="activity-notification">
                        <div className="activity-icon-wrapper" style={{ backgroundColor: `${style.color}20` }}>
                          <i className={`fas ${style.icon}`} style={{ color: style.color }}></i>
                        </div>
                        <div className="activity-details">
                          <div className="activity-header">
                            <span className="activity-action" style={{ color: style.color }}>
                              {style.text}
                            </span>
                            <span className="activity-time">{formatTimestamp(log.timestamp)}</span>
                          </div>
                          <p className="activity-product-name">{log.productName}</p>
                          {log.details && <span className="activity-description">{log.details}</span>}
                          {log.category && (
                            <span className="activity-category-badge">
                              <i className="fas fa-tag"></i> {log.category}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              ) : (
                <div className="empty-chart">
                  <i className="fas fa-inbox"></i>
                  <p>Chưa có hoạt động nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;