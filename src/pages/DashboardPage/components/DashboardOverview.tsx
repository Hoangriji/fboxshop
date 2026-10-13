import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useProducts } from '../../../hooks/useProducts';
import { useCategories } from '../../../hooks/useCategories';
import type { Product } from '../../../types';

interface PriceTier {
  key: string;
  label: string;
  count: number;
  percentage: number;
  totalValue: number;
  avgPrice: number;
}

interface StockSegment {
  name: string;
  value: number;
  percentage: number;
  color: string;
  badgeClass: string;
  description: string;
  icon: string;
}

const DashboardOverview: React.FC = () => {
  const { products, loading: productsLoading, mutate } = useProducts();
  const { categories } = useCategories();

  // Real orders & revenue state from Firestore 'orders' collection
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    loading: true
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStockPieHovered, setIsStockPieHovered] = useState(false);

  // Fetch real orders from Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, 'orders'));
        if (!isMounted) return;

        let revenue = 0;
        let pending = 0;

        ordersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const amount = typeof data.totalAmount === 'number' ? data.totalAmount : 0;
          revenue += amount;
          if (data.status === 'Pending') {
            pending++;
          }
        });

        setOrderStats({
          totalOrders: ordersSnapshot.size,
          totalRevenue: revenue,
          pendingOrders: pending,
          loading: false
        });
      } catch (err) {
        console.error('Error fetching orders for overview:', err);
        if (isMounted) {
          setOrderStats(prev => ({ ...prev, loading: false }));
        }
      }
    };

    fetchOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute product inventory metrics
  const productMetrics = useMemo(() => {
    const total = products.length;
    if (total === 0) {
      return {
        totalProducts: 0,
        inStock: 0,
        outOfStock: 0,
        lowStock: 0,
        recentProducts: 0,
        totalInventoryValue: 0,
        avgProductPrice: 0,
        inStockPercent: 0,
        featuredCount: 0
      };
    }

    let inStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let totalValue = 0;
    let recent = 0;
    let featured = 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    products.forEach((p: Product) => {
      const price = p.price_vnd || 0;
      totalValue += price;

      if (p.stock_status === 'in_stock') {
        inStock++;
      } else if (p.stock_status === 'low_stock') {
        lowStock++;
      } else {
        // default or 'out_of_stock'
        outOfStock++;
      }

      if (p.featured) {
        featured++;
      }

      if (p.created_at) {
        const createdDate = new Date(p.created_at);
        if (createdDate >= sevenDaysAgo) {
          recent++;
        }
      }
    });

    const inStockPercent = total > 0 ? Math.round((inStock / total) * 100) : 0;
    const avgProductPrice = total > 0 ? Math.round(totalValue / total) : 0;

    return {
      totalProducts: total,
      inStock,
      outOfStock,
      lowStock,
      recentProducts: recent,
      totalInventoryValue: totalValue,
      avgProductPrice,
      inStockPercent,
      featuredCount: featured
    };
  }, [products]);

  // Compute price brackets for Price Distribution Chart
  const priceTiers = useMemo<PriceTier[]>(() => {
    const total = products.length;
    if (total === 0) return [];

    const tiers = [
      { key: '<1M', label: '< 1 Triệu', min: 0, max: 1_000_000, count: 0, totalValue: 0 },
      { key: '1M-1.5M', label: '1M - 1.5M', min: 1_000_000, max: 1_500_000, count: 0, totalValue: 0 },
      { key: '1.5M-2M', label: '1.5M - 2.0M', min: 1_500_000, max: 2_000_000, count: 0, totalValue: 0 },
      { key: '2M-3M', label: '2.0M - 3.0M', min: 2_000_000, max: 3_000_000, count: 0, totalValue: 0 },
      { key: '>3M', label: '> 3 Triệu', min: 3_000_000, max: Infinity, count: 0, totalValue: 0 },
    ];

    products.forEach((p: Product) => {
      const price = p.price_vnd || 0;
      for (const tier of tiers) {
        if (tier.max === Infinity) {
          if (price >= tier.min) {
            tier.count++;
            tier.totalValue += price;
            break;
          }
        } else {
          if (price >= tier.min && price < tier.max) {
            tier.count++;
            tier.totalValue += price;
            break;
          }
        }
      }
    });

    return tiers.map(t => ({
      key: t.key,
      label: t.label,
      count: t.count,
      percentage: total > 0 ? Number(((t.count / total) * 100).toFixed(1)) : 0,
      totalValue: t.totalValue,
      avgPrice: t.count > 0 ? Math.round(t.totalValue / t.count) : 0
    }));
  }, [products]);

  // Stock health segments for Donut chart
  const stockSegments = useMemo<StockSegment[]>(() => {
    const { totalProducts, inStock, outOfStock, lowStock } = productMetrics;
    if (totalProducts === 0) return [];

    const segments: StockSegment[] = [
      {
        name: 'Còn hàng',
        value: inStock,
        percentage: Number(((inStock / totalProducts) * 100).toFixed(1)),
        color: '#10b981',
        badgeClass: 'badge-emerald',
        description: 'Sản phẩm có sẵn để giao ngay lập tức',
        icon: 'fa-check'
      },
      {
        name: 'Hết hàng / Đặt trước',
        value: outOfStock,
        percentage: Number(((outOfStock / totalProducts) * 100).toFixed(1)),
        color: '#f43f5e',
        badgeClass: 'badge-rose',
        description: 'Cần liên hệ nhập hàng hoặc tư vấn đặt trước',
        icon: 'fa-clock'
      }
    ];

    if (lowStock > 0) {
      segments.push({
        name: 'Sắp hết hàng',
        value: lowStock,
        percentage: Number(((lowStock / totalProducts) * 100).toFixed(1)),
        color: '#f59e0b',
        badgeClass: 'badge-amber',
        description: 'Số lượng tồn ít, cần bổ sung sớm',
        icon: 'fa-triangle-exclamation'
      });
    }

    return segments;
  }, [productMetrics]);

  // Top tier for insights
  const mostPopularTier = useMemo(() => {
    if (priceTiers.length === 0) return null;
    return [...priceTiers].sort((a, b) => b.count - a.count)[0];
  }, [priceTiers]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (mutate) {
        mutate();
      }
      const snap = await getDocs(collection(db, 'orders'));
      let rev = 0;
      let pending = 0;
      snap.forEach(docSnap => {
        const d = docSnap.data();
        rev += (d.totalAmount || 0);
        if (d.status === 'Pending') pending++;
      });
      setOrderStats({
        totalOrders: snap.size,
        totalRevenue: rev,
        pendingOrders: pending,
        loading: false
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="dashboard-overview">
      {/* Welcome & Live Status Header */}
      <div className="welcome-header">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Tổng quan cửa hàng Fbox Shop
          </h1>
          <p className="welcome-subtitle">
            Hệ thống phân tích thời gian thực: Danh mục bàn phím, tồn kho và đơn hàng
          </p>
        </div>
        <div className="welcome-actions">
          <button
            className={`btn-refresh ${isRefreshing ? 'is-loading' : ''}`}
            onClick={handleManualRefresh}
            title="Làm mới số liệu"
          >
            <i className={`fa-solid fa-arrows-rotate ${isRefreshing ? 'fa-spin' : ''}`}></i>
            <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
          <div className="welcome-time">
            <span className="time-badge">
              <i className="fa-regular fa-calendar-days"></i>
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Clean, Real & Accurate KPI Cards */}
      <div className="overview-stats-grid">
        {/* Card 1: Total Products */}
        <div className="stat-card stat-card-products">
          <div className="stat-icon">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
          <div className="stat-content">
            <div className="stat-header-row">
              <h3 className="stat-label">Tổng sản phẩm</h3>
              <span className="stat-tag tag-cyan">Catalog</span>
            </div>
            <p className="stat-number">
              {productsLoading ? '...' : productMetrics.totalProducts}
            </p>
            <div className="stat-footer-info">
              <span className="stat-change positive">
                <i className="fa-solid fa-arrow-trend-up"></i>
                {productMetrics.recentProducts} mới trong 7 ngày
              </span>
              <span className="stat-subtext">
                {categories.length > 0 ? `${categories.length} danh mục đã tạo` : 'Đã đồng bộ từ Akko'}
              </span>
            </div>
          </div>
          <div className="stat-bg-icon">
            <i className="fa-solid fa-boxes-stacked"></i>
          </div>
        </div>

        {/* Card 2: Stock Health & Readiness */}
        <div className="stat-card stat-card-stock">
          <div className="stat-icon">
            <i className="fa-solid fa-warehouse"></i>
          </div>
          <div className="stat-content">
            <div className="stat-header-row">
              <h3 className="stat-label">Sẵn sàng bán</h3>
              <span className="stat-tag tag-emerald">
                {productMetrics.inStockPercent}% có sẵn
              </span>
            </div>
            <p className="stat-number">
              {productsLoading ? '...' : `${productMetrics.inStock} / ${productMetrics.totalProducts}`}
            </p>
            {/* Visual mini stock health bar */}
            <div className="stock-health-bar-container">
              <div
                className="stock-health-bar-fill fill-in-stock"
                style={{ width: `${productMetrics.inStockPercent}%` }}
                title={`Còn hàng: ${productMetrics.inStock}`}
              ></div>
              <div
                className="stock-health-bar-fill fill-out-stock"
                style={{ width: `${100 - productMetrics.inStockPercent}%` }}
                title={`Hết hàng: ${productMetrics.outOfStock}`}
              ></div>
            </div>
            <div className="stat-footer-info">
              <span className="stat-subtext">
                <strong style={{ color: '#10b981' }}>{productMetrics.inStock}</strong> sẵn sàng ·{' '}
                <strong style={{ color: '#f43f5e' }}>{productMetrics.outOfStock}</strong> cần liên hệ / đặt hàng
              </span>
            </div>
          </div>
          <div className="stat-bg-icon">
            <i className="fa-solid fa-warehouse"></i>
          </div>
        </div>

        {/* Card 3: Real Orders & Sales */}
        <div className="stat-card stat-card-orders">
          <div className="stat-icon">
            <i className="fa-solid fa-receipt"></i>
          </div>
          <div className="stat-content">
            <div className="stat-header-row">
              <h3 className="stat-label">Đơn hàng thực tế</h3>
              <span className="stat-tag tag-purple">
                {orderStats.totalRevenue.toLocaleString('vi-VN')} ₫
              </span>
            </div>
            <p className="stat-number">
              {orderStats.loading ? '...' : `${orderStats.totalOrders} đơn`}
            </p>
            <div className="stat-footer-info">
              <span className="stat-change" style={{ color: '#a855f7' }}>
                <i className="fa-solid fa-coins"></i> Doanh thu thực: {orderStats.totalRevenue.toLocaleString('vi-VN')} ₫
              </span>
              <span className="stat-subtext">
                {orderStats.pendingOrders > 0
                  ? `${orderStats.pendingOrders} đơn chờ xử lý thanh toán`
                  : 'Hệ thống sẵn sàng nhận đơn đặt hàng'}
              </span>
            </div>
          </div>
          <div className="stat-bg-icon">
            <i className="fa-solid fa-receipt"></i>
          </div>
        </div>
      </div>

      {/* Two Meaningful, Modern Charts with Recharts */}
      <div className="charts-row">
        {/* Chart 1: Price Tier Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <i className="fa-solid fa-chart-column"></i>
                Phân khúc giá sản phẩm
              </h3>
              <p className="chart-description">
                Cơ cấu số lượng sản phẩm theo từng khoảng giá bán lẻ
              </p>
            </div>
            {mostPopularTier && (
              <span className="chart-badge">
                Phổ biến: {mostPopularTier.label} ({mostPopularTier.count} SP)
              </span>
            )}
          </div>
          <div className="chart-content">
            {priceTiers.length > 0 ? (
              <div className="recharts-wrapper-container" style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={priceTiers}
                    margin={{ top: 20, right: 20, left: -10, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="priceBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d2ff" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="priceBarHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as PriceTier;
                          return (
                            <div className="recharts-custom-tooltip">
                              <div className="tooltip-header">
                                <span className="tooltip-indicator" style={{ background: '#00d2ff' }}></span>
                                <strong>{data.label}</strong>
                              </div>
                              <div className="tooltip-body">
                                <div className="tooltip-row">
                                  <span>Số lượng:</span>
                                  <strong>{data.count} sản phẩm ({data.percentage}%)</strong>
                                </div>
                                <div className="tooltip-row">
                                  <span>Giá trung bình:</span>
                                  <strong>{data.avgPrice.toLocaleString('vi-VN')} ₫</strong>
                                </div>
                                <div className="tooltip-row">
                                  <span>Tổng giá trị tier:</span>
                                  <strong>{(data.totalValue / 1_000_000).toFixed(1)}M ₫</strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#priceBarGradient)"
                      radius={[8, 8, 0, 0]}
                      maxBarSize={55}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-chart">
                <i className="fa-solid fa-chart-column"></i>
                <p>Chưa có dữ liệu sản phẩm</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Inventory Health & Stock Ratio */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">
                <i className="fa-solid fa-chart-pie"></i>
                Tỷ lệ tồn kho & Sẵn sàng bán
              </h3>
              <p className="chart-description">
                Đánh giá mức độ sẵn sàng cung ứng sản phẩm cho khách hàng
              </p>
            </div>
            <span className="chart-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              {productMetrics.inStockPercent}% Sẵn sàng
            </span>
          </div>
          <div className="chart-content stock-breakdown-content">
            {stockSegments.length > 0 ? (
              <div className="stock-chart-layout">
                <div className="donut-chart-container" style={{ width: 220, height: 220, position: 'relative', flexShrink: 0 }}>
                  {/* Center Metric - Placed BEFORE PieChart so Tooltip naturally stacks above it */}
                  <div className={`donut-center-metric ${isStockPieHovered ? 'is-hovered' : ''}`}>
                    <span className="center-number">{productMetrics.totalProducts}</span>
                    <span className="center-label">Tổng SP</span>
                  </div>

                  <PieChart width={220} height={220}>
                    <Tooltip
                      wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as StockSegment;
                          return (
                            <div className="recharts-custom-tooltip">
                              <div className="tooltip-header">
                                <span className="tooltip-indicator" style={{ background: data.color }}></span>
                                <strong>{data.name}</strong>
                              </div>
                              <div className="tooltip-body">
                                <div className="tooltip-row">
                                  <span>Số lượng:</span>
                                  <strong>{data.value} sản phẩm</strong>
                                </div>
                                <div className="tooltip-row">
                                  <span>Tỷ lệ:</span>
                                  <strong>{data.percentage}%</strong>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={stockSegments}
                      dataKey="value"
                      nameKey="name"
                      cx={110}
                      cy={110}
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      isAnimationActive={false}
                      stroke="none"
                      onMouseEnter={() => setIsStockPieHovered(true)}
                      onMouseLeave={() => setIsStockPieHovered(false)}
                    >
                      {stockSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>

                {/* Stock Legend & Detail Cards */}
                <div className="stock-legend-list">
                  {stockSegments.map((seg) => (
                    <div key={seg.name} className="stock-legend-item">
                      <div className="legend-item-header">
                        <div className="legend-indicator-group">
                          <span className="legend-color-dot" style={{ backgroundColor: seg.color }}></span>
                          <span className="legend-item-name">{seg.name}</span>
                        </div>
                        <div className="legend-item-count">
                          <strong>{seg.value}</strong>
                          <span className="legend-item-pct">({seg.percentage}%)</span>
                        </div>
                      </div>
                      <div className="legend-progress-bar">
                        <div
                          className="legend-progress-fill"
                          style={{ width: `${seg.percentage}%`, backgroundColor: seg.color }}
                        ></div>
                      </div>
                      <p className="legend-item-desc">{seg.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-chart">
                <i className="fa-solid fa-chart-pie"></i>
                <p>Chưa có dữ liệu tồn kho</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;