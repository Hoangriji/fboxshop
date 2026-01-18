import React, { useEffect, useState } from 'react';
import { productCache } from '../../utils/productCache';
import './CacheIndicator.css';

export const CacheIndicator: React.FC = () => {
  const [stats, setStats] = useState<{
    categories: string[];
    totalProducts: number;
    cacheSize: number;
    countsCache: boolean;
  } | null>(null);
  
  const [show, setShow] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const newStats = productCache.getStats();
      setStats(newStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!stats || stats.totalProducts === 0) return null;

  return (
    <>
      {/* Cache icon button */}
      <button 
        className="cache-indicator-btn"
        onClick={() => setShow(!show)}
        title="Cache Status"
      >
        <i className="fas fa-database"></i>
        <span className="cache-count">{stats.totalProducts}</span>
      </button>

      {/* Cache details modal */}
      {show && (
        <div className="cache-modal-overlay" onClick={() => setShow(false)}>
          <div className="cache-modal" onClick={e => e.stopPropagation()}>
            <div className="cache-modal-header">
              <h3><i className="fas fa-database"></i> Cache Status</h3>
              <button onClick={() => setShow(false)} className="close-btn">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="cache-modal-body">
              <div className="cache-stat">
                <div className="stat-label">
                  <i className="fas fa-box"></i> Cached Products
                </div>
                <div className="stat-value">{stats.totalProducts}</div>
              </div>

              <div className="cache-stat">
                <div className="stat-label">
                  <i className="fas fa-folder"></i> Categories Cached
                </div>
                <div className="stat-value">{stats.cacheSize}</div>
              </div>

              <div className="cache-stat">
                <div className="stat-label">
                  <i className="fas fa-hashtag"></i> Category Counts
                </div>
                <div className="stat-value">
                  {stats.countsCache ? '✓ Cached' : '✗ Not cached'}
                </div>
              </div>

              {stats.categories.length > 0 && (
                <div className="cached-categories">
                  <div className="stat-label">
                    <i className="fas fa-list"></i> Cached Categories:
                  </div>
                  <div className="category-tags">
                    {stats.categories.map(cat => (
                      <span key={cat} className="category-tag">
                        {cat === 'all' ? 'All Products' : cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="clear-cache-btn"
                onClick={() => {
                  productCache.clear();
                  setStats(null);
                  setShow(false);
                  window.location.reload();
                }}
              >
                <i className="fas fa-trash"></i> Clear Cache
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
