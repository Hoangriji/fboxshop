import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import { Pie, Column } from '@ant-design/plots';
import type { Product, Category } from '../../../types';

interface CategoryStats {
  name: string;
  count: number;
  value: number;
  color: string;
}

const DashboardOverview: React.FC = () => {
  const { products } = useProducts();
  const { categories } = useCategories();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalInvoiceValue: 0,
    outOfStockProducts: 0,
    recentProducts: 0
  });

  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);

  useEffect(() => {
    if (products && categories) {
      // Calculate total inventory value (physical products only)
      const totalValue = products
        .filter((p: Product) => p.type === 'physical')
        .reduce((sum: number, p: Product) => sum + (p.price_vnd || 0), 0);
      
      const outOfStock = products.filter((p: Product) => p.type === 'physical' && p.stock_status === 'out_of_stock').length;
      const recent = products.filter((p: Product) => {
        const createdAt = new Date(p.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      }).length;

      setStats({
        totalProducts: products.length,
        totalInvoiceValue: totalValue,
        outOfStockProducts: outOfStock,
        recentProducts: recent
      });

      // Calculate category statistics
      const colors = [
        '#00d2ff', '#a855f7', '#ec4899', '#10b981', 
        '#f59e0b', '#ef4444', '#14b8a6', '#6366f1',
        '#22d3ee', '#fb923c', '#e879f9', '#a3e635'
      ];
      
      const catStats = categories.map((cat: Category, index: number) => {
        const categoryProducts = products.filter((p: Product) => p.category === cat.id);
        const count = categoryProducts.length;
        const value = categoryProducts.reduce((sum: number, p: Product) => sum + (p.price_vnd || 0), 0);
        
        return {
          name: cat.name,
          count,
          value,
          color: colors[index % colors.length]
        };
      }).filter(cat => cat.count > 0);

      setCategoryStats(catStats);
    }
  }, [products, categories]);

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
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Tổng giá trị hóa đơn</h3>
            <p className="stat-number">{(stats.totalInvoiceValue / 1000000).toFixed(1)}M</p>
            <span className="stat-change">
              {stats.totalProducts > 0 ? (stats.totalInvoiceValue / stats.totalProducts).toLocaleString('vi-VN') : 0}đ/sp trung bình
            </span>
          </div>
          <div className="stat-bg-icon">
            <i className="fas fa-file-invoice-dollar"></i>
          </div>
        </div>
        
        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-content">
            <h3 className="stat-label">Hết hàng</h3>
            <p className="stat-number">{stats.outOfStockProducts}</p>
            <span className="stat-change" style={{ color: stats.outOfStockProducts > 0 ? '#ef4444' : '#10b981' }}>
              {stats.outOfStockProducts > 0 ? 'Cần nhập thêm' : 'Kho đầy đủ'}
            </span>
          </div>
          <div className="stat-bg-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Category Distribution Pie Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <i className="fas fa-chart-pie"></i>
              Phân bố sản phẩm theo danh mục
            </h3>
            <span className="chart-badge">{categoryStats.length} danh mục</span>
          </div>
          <div className="chart-content">
            {categoryStats.length > 0 ? (
              <div className="ant-chart-wrapper">
                <Pie
                  data={categoryStats.map(cat => ({
                    type: cat.name,
                    value: cat.count,
                  }))}
                  angleField="value"
                  colorField="type"
                  radius={0.75}
                  innerRadius={0.55}
                  height={400}
                  label={{
                    type: 'outer',
                    content: '{name}: {value}',
                  }}
                  legend={{
                    position: 'bottom' as const,
                  }}
                  statistic={{
                    title: {
                      content: 'Tổng',
                    },
                    content: {
                      content: stats.totalProducts.toString(),
                    },
                  }}
                  color={categoryStats.map(cat => cat.color)}
                  tooltip={{
                    formatter: (datum: any) => {
                      const percentage = ((datum.value / stats.totalProducts) * 100).toFixed(1);
                      return {
                        name: datum.type,
                        value: `${datum.value} sản phẩm (${percentage}%)`,
                      };
                    },
                  }}
                />
              </div>
            ) : (
              <div className="empty-chart">
                <i className="fas fa-chart-pie"></i>
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Value Column Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <i className="fas fa-chart-bar"></i>
              Giá trị kho theo danh mục
            </h3>
            <span className="chart-badge">{(stats.totalInvoiceValue / 1000000).toFixed(1)}M tổng</span>
          </div>
          <div className="chart-content">
            {categoryStats.length > 0 ? (
              <div className="ant-chart-wrapper">
                <Column
                  data={categoryStats.map(cat => ({
                    category: cat.name,
                    value: cat.value / 1000000,
                  }))}
                  xField="category"
                  yField="value"
                  height={400}
                  color={categoryStats.map(cat => cat.color)}
                  label={{
                    position: 'top',
                    formatter: (datum: any) => `${datum.value.toFixed(1)}M`,
                  }}
                  yAxis={{
                    title: {
                      text: 'Giá trị (Triệu đồng)',
                    },
                  }}
                  xAxis={{
                    label: {
                      autoRotate: true,
                      autoHide: false,
                    },
                  }}
                  tooltip={{
                    formatter: (datum: any) => {
                      const cat = categoryStats.find(c => c.name === datum.category);
                      return {
                        name: datum.category,
                        value: `${datum.value.toFixed(2)}M đồng (${cat?.count || 0} sản phẩm)`,
                      };
                    },
                  }}
                  columnStyle={{
                    radius: [8, 8, 0, 0],
                  }}
                />
              </div>
            ) : (
              <div className="empty-chart">
                <i className="fas fa-chart-bar"></i>
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;