import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { ProductsService } from '../../../services/firebaseService';
import { ScrapeLogsService } from '../../../services/scrapeLogsService';
import { syncAkkoProductsWithFirestore, normalizeName } from '../../../lib/akko/sync';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import type { ScrapeLog } from '../../../types';
import type { AkkoParsedProduct } from '../../../lib/akko/types';
import './AkkoKeyboardUpdater.css';

interface AkkoApiResponse {
  success: boolean;
  requestedPageRange: string;
  startPage: number;
  endPage: number;
  expectedCount: number;
  fetchedCount: number;
  sourcePages: number;
  products: AkkoParsedProduct[];
  error?: string;
}

type TabType = 'crawl' | 'logs' | 'cron';
type CrawlMode = 'all' | 'range';
type RowStatus = 'existing' | 'new';

const AkkoKeyboardUpdater: React.FC = () => {
  const { products: existingProducts, mutate: refreshProducts } = useProducts();
  const [activeTab, setActiveTab] = useState<TabType>('crawl');
  const [crawlMode, setCrawlMode] = useState<CrawlMode>('all');
  const [pageRangeInput, setPageRangeInput] = useState('1');

  // Crawling state
  const [fetchedProducts, setFetchedProducts] = useState<AkkoParsedProduct[]>([]);
  const [fetching, setFetching] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Wipe & Re-import state
  const [wiping, setWiping] = useState(false);
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [wipeProgress, setWipeProgress] = useState<{ stage: string; percent: number } | null>(null);

  // Logs state
  const [logs, setLogs] = useState<ScrapeLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Cron test state
  const [testingCron, setTestingCron] = useState(false);
  const [cronTestResult, setCronTestResult] = useState<string | null>(null);

  // Feedback notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Existing products name lookup
  const existingNameMap = useMemo(() => {
    const map = new Map<string, string>();
    existingProducts.forEach((p) => {
      if (p.category === 'keyboard') {
        map.set(normalizeName(p.name), p.id);
      }
    });
    return map;
  }, [existingProducts]);

  // Existing products source_id lookup
  const existingSourceIdMap = useMemo(() => {
    const map = new Map<number | string, string>();
    existingProducts.forEach((p) => {
      if (p.source_id) {
        map.set(p.source_id, p.id);
      }
    });
    return map;
  }, [existingProducts]);

  const rows = useMemo(() => {
    return fetchedProducts.map((p) => {
      const isExisting =
        (p.source_id && existingSourceIdMap.has(p.source_id)) ||
        existingNameMap.has(normalizeName(p.name));

      return {
        ...p,
        status: (isExisting ? 'existing' : 'new') as RowStatus,
        specCount: p.specs ? Object.keys(p.specs).length : 0,
        featureCount: p.features ? p.features.length : 0,
      };
    });
  }, [fetchedProducts, existingNameMap, existingSourceIdMap]);

  const stats = useMemo(() => {
    const total = rows.length;
    const existing = rows.filter((r) => r.status === 'existing').length;
    const fresh = total - existing;
    const withSpecs = rows.filter((r) => r.specCount > 0).length;
    return { total, existing, fresh, withSpecs };
  }, [rows]);

  // Load logs
  const loadLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await ScrapeLogsService.getLogs(30);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load scrape logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Tự động load logs ngay khi mount trang để badge hiển thị số lượng chính xác lập tức
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Refresh logs khi người dùng chuyển sang tab logs
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, loadLogs]);

  // Handle Fetching from Akko Store API
  const handleFetchProducts = async () => {
    setError(null);
    setSuccess(null);
    setFetching(true);

    try {
      const requestBody =
        crawlMode === 'all'
          ? { action: 'fetch_all' }
          : { action: 'fetch_range', pageRange: pageRangeInput.trim() };

      const response = await fetch('/api/akko-keyboard-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const body = (await response.json().catch(() => ({}))) as AkkoApiResponse;
      if (!response.ok) {
        throw new Error(body.error || `Lỗi máy chủ (${response.status}) khi cào Akko.`);
      }

      setFetchedProducts(body.products || []);
      setSuccess(
        `Đã tải thành công ${body.fetchedCount} sản phẩm từ Akko! (${body.products.filter(p => p.specs && Object.keys(p.specs).length > 0).length} sản phẩm có đầy đủ thông số kỹ thuật).`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể lấy dữ liệu từ Akko.';
      setError(msg);
      setFetchedProducts([]);
    } finally {
      setFetching(false);
    }
  };

  // Handle Sync (policy: update prices & stock for existing, create new, mark missing as out_of_stock)
  const handleConfirmSync = async () => {
    setShowSyncModal(false);
    if (fetchedProducts.length === 0) return;

    setSyncing(true);
    setError(null);
    setSuccess(null);
    setSyncProgress({ stage: 'Bắt đầu đồng bộ...', percent: 0 });

    try {
      const result = await syncAkkoProductsWithFirestore(
        fetchedProducts,
        'manual',
        (progress) => {
          const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 50;
          setSyncProgress({ stage: progress.stage, percent: pct });
        }
      );

      setSuccess(
        `Đồng bộ thành công! Đã thêm mới ${result.newCount} sản phẩm, cập nhật giá & tồn kho ${result.updatedCount} sản phẩm, đánh dấu hết hàng ${result.outOfStockCount} sản phẩm.`
      );
      if (refreshProducts) refreshProducts();
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đồng bộ sản phẩm.');
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  // Handle Wipe All & Fresh Re-Import
  const handleConfirmWipeAndReimport = async () => {
    setShowWipeModal(false);
    setWiping(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Ensure we have the full product catalog
      let productsToImport = fetchedProducts;
      if (productsToImport.length < 300) {
        setWipeProgress({ stage: 'Bước 1/3: Đang lấy toàn bộ dữ liệu bàn phím từ Akko...', percent: 15 });
        const res = await fetch('/api/akko-keyboard-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetch_all' }),
        });
        const data = (await res.json()) as AkkoApiResponse;
        if (!res.ok || !data.products) {
          throw new Error(data.error || 'Không thể cào dữ liệu toàn bộ từ Akko.');
        }
        productsToImport = data.products;
        setFetchedProducts(productsToImport);
      }

      // Step 2: Delete all old Akko keyboards
      setWipeProgress({ stage: 'Bước 2/3: Đang xóa sạch toàn bộ sản phẩm bàn phím Akko cũ...', percent: 40 });
      const deletedCount = await ProductsService.deleteAkkoProducts((deleted, total) => {
        const pct = 40 + Math.round((deleted / Math.max(total, 1)) * 30);
        setWipeProgress({
          stage: `Bước 2/3: Đã xóa ${deleted}/${total} sản phẩm Akko cũ...`,
          percent: pct,
        });
      });

      // Ensure strict chronological ordering:
      // Index 0 (newest on Akko) gets baseTimestamp,
      // Index i gets baseTimestamp - i * 60000 ms.
      const baseTimestamp = Date.now();
      const chronologicalProducts = productsToImport.map((p, idx) => ({
        ...p,
        created_at: new Date(baseTimestamp - idx * 60000).toISOString(),
      }));

      // Step 3: Fast batch insert all fresh keyboards
      setWipeProgress({ stage: `Bước 3/3: Đang nhập mới ${chronologicalProducts.length} bàn phím với thông số đầy đủ...`, percent: 70 });
      const importResult = await ProductsService.fastBatchCreateProducts(
        chronologicalProducts,
        (current, total) => {
          const pct = 70 + Math.round((current / Math.max(total, 1)) * 30);
          setWipeProgress({
            stage: `Bước 3/3: Đang lưu vào hệ thống (${current}/${total})...`,
            percent: Math.min(100, pct),
          });
        }
      );

      // Record log
      await ScrapeLogsService.addLog({
        source: 'akko',
        type: 'manual',
        status: 'success',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_scanned: productsToImport.length,
        new_count: importResult.success,
        updated_count: 0,
        out_of_stock_count: 0,
        error_count: 0,
        errors: [],
        message: `Xóa sạch ${deletedCount} sản phẩm cũ và cào mới toàn bộ thành công ${importResult.success} bàn phím Akko!`,
      }).catch(() => {});

      setSuccess(
        `Thành công tuyệt đối! Đã xóa sạch ${deletedCount} sản phẩm cũ và nhập mới ${importResult.success} bàn phím Akko với thông số kỹ thuật chuẩn nhất từ Akko!`
      );
      if (refreshProducts) refreshProducts();
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi xóa và cào lại dữ liệu.');
    } finally {
      setWiping(false);
      setWipeProgress(null);
    }
  };

  // Test Cron Endpoint directly
  const handleTestCron = async () => {
    setTestingCron(true);
    setCronTestResult(null);
    try {
      const res = await fetch('/api/cron/akko-sync');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCronTestResult(
          `Cron thực thi thành công! ${data.message || JSON.stringify(data)}`
        );
        loadLogs();
      } else {
        setCronTestResult(
          `Cron trả về lỗi (${res.status}): ${data.error || 'Kiểm tra log server'}`
        );
      }
    } catch (err) {
      setCronTestResult(
        `Không thể gọi Cron endpoint: ${err instanceof Error ? err.message : 'Lỗi kết nối'}`
      );
    } finally {
      setTestingCron(false);
    }
  };

  return (
    <div className="akko-keyboard-updater">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>
            <i className="fa-solid fa-keyboard"></i>
            Quản lý & Cào dữ liệu Bàn phím Akko
          </h2>
          <p className="page-description">
            Hệ thống bóc tách dữ liệu thông minh từ Akko WooCommerce API, tự động trích xuất bảng thông số kĩ thuật và đồng bộ định kỳ.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="akko-tabs">
        <button
          type="button"
          className={`akko-tab-btn ${activeTab === 'crawl' ? 'active' : ''}`}
          onClick={() => setActiveTab('crawl')}
        >
          <i className="fa-solid fa-cloud-arrow-down"></i>
          Cào & Cập nhật dữ liệu
        </button>
        <button
          type="button"
          className={`akko-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <i className="fa-solid fa-clock-rotate-left"></i>
          Lịch sử cào ({logs.length})
        </button>
        <button
          type="button"
          className={`akko-tab-btn ${activeTab === 'cron' ? 'active' : ''}`}
          onClick={() => setActiveTab('cron')}
        >
          <i className="fa-solid fa-robot"></i>
          Tự động đồng bộ (Cron)
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert-message alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
          <button type="button" className="alert-close" onClick={() => setError(null)}>
            &times;
          </button>
        </div>
      )}
      {success && (
        <div className="alert-message alert-success">
          <i className="fa-solid fa-circle-check"></i>
          <span>{success}</span>
          <button type="button" className="alert-close" onClick={() => setSuccess(null)}>
            &times;
          </button>
        </div>
      )}

      {/* TAB 1: CRAWL & SYNC */}
      {activeTab === 'crawl' && (
        <div className="akko-tab-content">
          <div className="akko-fetch-panel">
            <div className="mode-selection">
              <label className="radio-label">
                <input
                  type="radio"
                  name="crawlMode"
                  value="all"
                  checked={crawlMode === 'all'}
                  onChange={() => setCrawlMode('all')}
                />
                <span className="radio-custom"></span>
                <strong>Toàn bộ danh mục bàn phím (336+ sản phẩm)</strong>
                <small>Khuyên dùng: lấy toàn bộ chỉ trong 4 request JSON</small>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="crawlMode"
                  value="range"
                  checked={crawlMode === 'range'}
                  onChange={() => setCrawlMode('range')}
                />
                <span className="radio-custom"></span>
                <strong>Theo khoảng trang</strong>
                <small>Ví dụ: 1 hoặc 1-2 (mỗi trang có 100 sản phẩm)</small>
              </label>
            </div>

            {crawlMode === 'range' && (
              <div className="akko-input-group">
                <label htmlFor="pageRangeInput">Khoảng trang (Trang 1 đến 4):</label>
                <input
                  id="pageRangeInput"
                  type="text"
                  value={pageRangeInput}
                  onChange={(e) => setPageRangeInput(e.target.value)}
                  placeholder="Ví dụ: 1 hoặc 1-2"
                  disabled={fetching}
                />
              </div>
            )}

            <div className="akko-fetch-btn-container">
              <button
                type="button"
                className="btn-primary"
                onClick={handleFetchProducts}
                disabled={fetching || syncing || wiping}
              >
                {fetching ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Đang cào dữ liệu...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-magnifying-glass"></i>
                    {crawlMode === 'all' ? 'Cào toàn bộ từ Akko' : 'Cào dữ liệu trang đã chọn'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Indicators */}
          {(syncing && syncProgress) && (
            <div className="progress-banner">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${syncProgress.percent}%` }}></div>
              </div>
              <p className="progress-text">
                <i className="fa-solid fa-arrows-rotate fa-spin"></i>
                {syncProgress.stage} ({syncProgress.percent}%)
              </p>
            </div>
          )}

          {(wiping && wipeProgress) && (
            <div className="progress-banner wipe-banner">
              <div className="progress-bar">
                <div className="progress-fill wipe-fill" style={{ width: `${wipeProgress.percent}%` }}></div>
              </div>
              <p className="progress-text wipe-text">
                <i className="fa-solid fa-fire fa-spin"></i>
                {wipeProgress.stage} ({wipeProgress.percent}%)
              </p>
            </div>
          )}

          {/* Preview Section */}
          {rows.length > 0 && (
            <div className="akko-result-section">
              <div className="import-summary">
                <div className="summary-item summary-total">
                  <i className="fa-solid fa-boxes-stacked"></i>
                  <div>
                    <span className="summary-label">Đã cào được</span>
                    <span className="summary-value">{stats.total} sp</span>
                  </div>
                </div>
                <div className="summary-item summary-valid">
                  <i className="fa-solid fa-circle-check"></i>
                  <div>
                    <span className="summary-label">Đủ thông số kĩ thuật</span>
                    <span className="summary-value">{stats.withSpecs} sp</span>
                  </div>
                </div>
                <div className="summary-item summary-new">
                  <i className="fa-solid fa-plus-circle"></i>
                  <div>
                    <span className="summary-label">Sản phẩm mới</span>
                    <span className="summary-value">{stats.fresh} sp</span>
                  </div>
                </div>
                <div className="summary-item summary-warning">
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  <div>
                    <span className="summary-label">Đã có trong Shop</span>
                    <span className="summary-value">{stats.existing} sp</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-button-bar">
                <button
                  type="button"
                  className="btn-sync"
                  onClick={() => setShowSyncModal(true)}
                  disabled={syncing || wiping}
                >
                  <i className="fa-solid fa-arrows-rotate"></i>
                  Đồng bộ vào Shop (Cập nhật giá & thêm sp mới)
                </button>

                <button
                  type="button"
                  className="btn-danger-wipe"
                  onClick={() => setShowWipeModal(true)}
                  disabled={syncing || wiping}
                >
                  <i className="fa-solid fa-trash-can"></i>
                  XÓA SẠCH DỮ LIỆU AKKO CŨ & CÀO LẠI TOÀN BỘ
                </button>
              </div>

              {/* Table */}
              <div className="akko-table-wrapper">
                <table className="akko-table">
                  <thead>
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên sản phẩm</th>
                      <th>Giá bán</th>
                      <th>Giá gốc</th>
                      <th>Tồn kho</th>
                      <th>Thông số trích xuất</th>
                      <th>Trạng thái</th>
                      <th>Nguồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.source_id || row.name}>
                        <td className="col-img">
                          {row.images[0] ? (
                            <img src={row.images[0]} alt={row.name} className="product-thumb" />
                          ) : (
                            <div className="thumb-placeholder">
                              <i className="fa-solid fa-image"></i>
                            </div>
                          )}
                        </td>
                        <td className="col-name">
                          <strong>{row.name}</strong>
                          {row.features && row.features.length > 0 && (
                            <small className="feature-sample">
                              <i className="fa-solid fa-check"></i> {row.features[0]}
                            </small>
                          )}
                        </td>
                        <td>
                          <strong>{row.price_vnd.toLocaleString('vi-VN')}₫</strong>
                        </td>
                        <td>
                          {(row.original_price_vnd ?? 0) > row.price_vnd ? (
                            <span className="orig-price">{row.original_price_vnd?.toLocaleString('vi-VN')}₫</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <span className={`stock-pill ${row.stock_status}`}>
                            {row.stock_status === 'in_stock' ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </td>
                        <td>
                          <span className="spec-badge">
                            <i className="fa-solid fa-list-check"></i> {row.specCount} thông số
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-${row.status}`}>
                            {row.status === 'new' ? 'Chưa có (Mới)' : 'Đã có trong Shop'}
                          </span>
                        </td>
                        <td>
                          <a href={row.source_url} target="_blank" rel="noopener noreferrer">
                            Xem gốc <i className="fa-solid fa-arrow-up-right-from-square"></i>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCRAPE LOGS */}
      {activeTab === 'logs' && (
        <div className="akko-tab-content">
          <div className="logs-header-actions">
            <h3>Lịch sử các lần cào & đồng bộ dữ liệu</h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={loadLogs}
              disabled={loadingLogs}
            >
              <i className={`fa-solid fa-arrows-rotate ${loadingLogs ? 'fa-spin' : ''}`}></i>
              Làm mới
            </button>
          </div>

          {loadingLogs ? (
            <div className="logs-loading">
              <i className="fa-solid fa-spinner fa-spin"></i> Đang tải lịch sử...
            </div>
          ) : logs.length === 0 ? (
            <div className="logs-empty">
              <i className="fa-solid fa-inbox"></i>
              <p>Chưa có lịch sử đồng bộ nào được ghi nhận.</p>
            </div>
          ) : (
            <div className="akko-table-wrapper">
              <table className="akko-table logs-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Hình thức</th>
                    <th>Trạng thái</th>
                    <th>Quét</th>
                    <th>Mới</th>
                    <th>Cập nhật</th>
                    <th>Hết hàng</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="log-time">
                        {new Date(log.started_at).toLocaleString('vi-VN')}
                      </td>
                      <td>
                        <span className={`badge-type ${log.type}`}>
                          {log.type === 'cron' ? (
                            <>
                              <i className="fa-solid fa-robot"></i> Tự động (Cron)
                            </>
                          ) : (
                            <>
                              <i className="fa-solid fa-hand"></i> Thủ công
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-status ${log.status}`}>
                          {log.status === 'success' ? 'Thành công' : log.status === 'partial' ? 'Một phần' : 'Thất bại'}
                        </span>
                      </td>
                      <td>{log.total_scanned}</td>
                      <td className="text-success">+{log.new_count}</td>
                      <td className="text-info">{log.updated_count}</td>
                      <td className="text-warning">{log.out_of_stock_count}</td>
                      <td className="log-message">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CRON SETTINGS & GUIDE */}
      {activeTab === 'cron' && (
        <div className="akko-tab-content cron-tab">
          <div className="cron-status-card">
            <div className="cron-card-header">
              <i className="fa-solid fa-server"></i>
              <div>
                <h4>Trạng thái tự động hóa Vercel Cron</h4>
                <p>Hệ thống tự động kích hoạt đồng bộ bàn phím mỗi ngày một lần vào 02:00 UTC (09:00 sáng VN).</p>
              </div>
            </div>
            <div className="cron-meta-list">
              <div className="cron-meta-item">
                <span className="meta-label">Endpoint Cron:</span>
                <code>/api/cron/akko-sync</code>
              </div>
              <div className="cron-meta-item">
                <span className="meta-label">Lịch chạy:</span>
                <code>0 2 * * * (1 lần/ngày - Gói Vercel Hobby)</code>
              </div>
              <div className="cron-meta-item">
                <span className="meta-label">Chính sách đồng bộ:</span>
                <span>Thêm phím mới, cập nhật giá + tồn kho phím cũ, phím bị gỡ chuyển thành Hết hàng.</span>
              </div>
            </div>

            <div className="cron-test-box">
              <button
                type="button"
                className="btn-primary"
                onClick={handleTestCron}
                disabled={testingCron}
              >
                {testingCron ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang chạy thử Cron...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play"></i> Chạy thử đồng bộ Cron ngay
                  </>
                )}
              </button>
              {cronTestResult && (
                <div className="cron-test-output">
                  <pre>{cronTestResult}</pre>
                </div>
              )}
            </div>
          </div>

          <div className="guide-card">
            <h4><i className="fa-solid fa-key"></i> Hướng dẫn cấu hình Service Account trên Vercel</h4>
            <ol className="guide-steps">
              <li>
                <strong>Tạo Private Key trên Firebase:</strong> Vào{' '}
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Firebase Console
                </a>{' '}
                &gt; Project Settings &gt; Tab <strong>Service accounts</strong> &gt; Nhấn nút{' '}
                <strong>Generate new private key</strong> để tải về file <code>.json</code>.
              </li>
              <li>
                <strong>Thêm biến môi trường lên Vercel:</strong> Vào Dashboard dự án trên Vercel &gt; Settings &gt; Environment Variables.
                <div className="env-box">
                  <div className="env-row">
                    <span>Key:</span> <code>FIREBASE_SERVICE_ACCOUNT</code>
                  </div>
                  <div className="env-row">
                    <span>Value:</span> <code>[Mở file JSON vừa tải, copy toàn bộ nội dung và dán vào đây]</code>
                  </div>
                </div>
              </li>
              <li>
                <strong>Triển khai:</strong> File <code>vercel.json</code> đã được cấu hình sẵn lịch Cron. Khi deploy, Vercel sẽ tự động kích hoạt cron hàng ngày!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Sync */}
      <ConfirmationModal
        isOpen={showSyncModal}
        title="Xác nhận đồng bộ vào Shop"
        message={`Bạn có chắc muốn đồng bộ ${fetchedProducts.length} sản phẩm từ Akko vào database?`}
        warningText="Chính sách: Sản phẩm cũ chỉ cập nhật giá & tồn kho (giữ nguyên mô tả bạn đã sửa). Sản phẩm mới sẽ được thêm vào với thông số kĩ thuật đầy đủ. Sản phẩm Akko đã gỡ sẽ chuyển sang Hết hàng."
        icon="info"
        primaryButtonLabel="Bắt đầu đồng bộ"
        secondaryButtonLabel="Hủy"
        onPrimaryAction={handleConfirmSync}
        onClose={() => setShowSyncModal(false)}
      />

      {/* Confirmation Modal for Wipe & Reimport */}
      <ConfirmationModal
        isOpen={showWipeModal}
        title="CẢNH BÁO: XÓA SẠCH DỮ LIỆU CŨ & CÀO LẠI TOÀN BỘ"
        message="Hành động này sẽ xóa toàn bộ các sản phẩm bàn phím Akko hiện tại trong Shop và nạp mới toàn bộ 336 sản phẩm bàn phím từ Akko Store API với bảng thông số kỹ thuật chuẩn nhất."
        warningText="LƯU Ý: Toàn bộ sản phẩm bàn phím Akko hiện tại sẽ được thay thế mới. Khách hàng đã lưu sản phẩm cũ vào Wishlist có thể cần chọn lại."
        icon="warning"
        primaryButtonLabel="Xác nhận XÓA và CÀO MỚI"
        secondaryButtonLabel="Hủy bỏ"
        onPrimaryAction={handleConfirmWipeAndReimport}
        onClose={() => setShowWipeModal(false)}
      />
    </div>
  );
};

export default AkkoKeyboardUpdater;