import React, { useMemo, useState } from 'react';
import { useProducts } from '../../../hooks/useProducts';
import { ProductsService } from '../../../services/firebaseService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import type { Product } from '../../../types';
import './AkkoKeyboardUpdater.css';

interface AkkoProductPayload extends Omit<Product, 'id'> {
  source_url: string;
}

interface AkkoApiResponse {
  requestedPageRange: string;
  startPage: number;
  endPage: number;
  expectedCount: number;
  fetchedCount: number;
  sourcePages: number;
  products: AkkoProductPayload[];
}

type RowStatus = 'existing' | 'new';

const MAX_PAGE = 27;

const normalizeName = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ');

const AkkoKeyboardUpdater: React.FC = () => {
  const { products: existingProducts } = useProducts();
  const [pageRangeInput, setPageRangeInput] = useState('1');
  const [fetchedProducts, setFetchedProducts] = useState<AkkoProductPayload[]>([]);
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const existingNameSet = useMemo(
    () => new Set(existingProducts.map((product) => normalizeName(product.name))),
    [existingProducts]
  );

  const rows = useMemo(
    () => fetchedProducts.map((product) => ({
      ...product,
      status: existingNameSet.has(normalizeName(product.name)) ? 'existing' : 'new' as RowStatus,
    })),
    [fetchedProducts, existingNameSet]
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const existing = rows.filter((row) => row.status === 'existing').length;
    const fresh = total - existing;
    return { total, existing, fresh };
  }, [rows]);

  const parsePageRangeInput = (): string => {
    const raw = pageRangeInput.trim();
    if (!raw) {
      throw new Error('Vui lòng nhập trang cần lấy. Ví dụ "2" hoặc "2-5".');
    }

    const singleMatch = raw.match(/^(\d+)$/);
    const rangeMatch = raw.match(/^(\d+)\s*-\s*(\d+)$/);

    let startPage = 0;
    let endPage = 0;

    if (singleMatch) {
      startPage = Number.parseInt(singleMatch[1], 10);
      endPage = startPage;
    } else if (rangeMatch) {
      startPage = Number.parseInt(rangeMatch[1], 10);
      endPage = Number.parseInt(rangeMatch[2], 10);
    } else {
      throw new Error('Định dạng không hợp lệ. Dùng "2" hoặc "2-5".');
    }

    if (startPage < 1 || endPage < 1) {
      throw new Error('Trang phải bắt đầu từ 1.');
    }
    if (startPage > endPage) {
      throw new Error('Khoảng trang không hợp lệ: trang bắt đầu phải <= trang kết thúc.');
    }
    if (endPage > MAX_PAGE) {
      throw new Error(`Hiện tại chỉ hỗ trợ đến trang ${MAX_PAGE} của danh mục keyboard.`);
    }

    return startPage === endPage ? String(startPage) : `${startPage}-${endPage}`;
  };

  const handleFetchProducts = async () => {
    setError(null);
    setSuccess(null);

    let pageRange = '';
    try {
      pageRange = parsePageRangeInput();
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : 'Dữ liệu không hợp lệ.');
      return;
    }

    setFetching(true);

    try {
      const response = await fetch('/api/akko-keyboard-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageRange }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Không thể lấy dữ liệu từ Akko.');
      }

      const data = body as AkkoApiResponse;
      setFetchedProducts(data.products);
      setSuccess(
        `Đã lấy ${data.fetchedCount} sản phẩm từ trang ${data.requestedPageRange} (quét ${data.sourcePages} trang).`
      );
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Không thể lấy dữ liệu từ Akko.');
      setFetchedProducts([]);
    } finally {
      setFetching(false);
    }
  };

  const handleImportNewProducts = async () => {
    const newProducts = rows.filter((row) => row.status === 'new');
    if (newProducts.length === 0) {
      setError('Không có sản phẩm mới để thêm vào database.');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setError(null);
    setSuccess(null);

    let successCount = 0;
    const failed: string[] = [];

    for (let i = 0; i < newProducts.length; i += 1) {
      const productData = { ...newProducts[i] } as Partial<AkkoProductPayload>;
      Reflect.deleteProperty(productData, 'source_url');
      try {
        await ProductsService.createProduct(productData as Omit<Product, 'id'>);
        successCount += 1;
      } catch (importError) {
        const message = importError instanceof Error ? importError.message : 'Unknown error';
        failed.push(`${newProducts[i].name}: ${message}`);
      } finally {
        setImportProgress(Math.round(((i + 1) / newProducts.length) * 100));
      }
    }

    setImporting(false);

    if (failed.length > 0) {
      setError(
        `Đã thêm ${successCount}/${newProducts.length} sản phẩm mới. ${failed.length} sản phẩm thất bại.`
      );
      return;
    }

    setSuccess(`Đã thêm thành công ${successCount} sản phẩm mới vào database.`);
  };

  const handleRequestImport = () => {
    if (stats.fresh === 0) {
      setError('Không có sản phẩm mới để thêm vào database.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirmModal(false);
    await handleImportNewProducts();
  };

  return (
    <div className="akko-keyboard-updater">
      <div className="page-header">
        <h2>
          <i className="fas fa-keyboard"></i>
          Cập nhật thêm keyboard Akko
        </h2>
      </div>

      <p className="page-description">
        Nhập theo trang cần lấy từ https://akko.vn/keyboard/:
        một trang (ví dụ: 2) hoặc khoảng trang (ví dụ: 2-5). Mỗi trang có 12 sản phẩm.
      </p>

      <div className="akko-fetch-panel">
        <div className="akko-input-group">
          <label htmlFor="akko-page-range">Trang cần lấy dữ liệu</label>
          <input
            id="akko-page-range"
            type="text"
            inputMode="numeric"
            value={pageRangeInput}
            onChange={(event) => setPageRangeInput(event.target.value)}
            disabled={fetching || importing}
          />
          <small>
            Ví dụ: 1 (trang 1), 2 (trang 2), 2-5 (lấy trang 2 đến trang 5, tổng 48 sản phẩm).
          </small>
        </div>

        <button className="btn-primary" onClick={handleFetchProducts} disabled={fetching || importing}>
          <i className={fetching ? 'fas fa-spinner fa-spin' : 'fas fa-cloud-download-alt'}></i>
          {fetching ? 'Đang lấy dữ liệu...' : 'Lấy dữ liệu Akko'}
        </button>
      </div>

      {error && (
        <div className="message message-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="message message-success">
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {rows.length > 0 && (
        <div className="akko-result-section">
          <div className="import-summary">
            <div className="summary-item summary-total">
              <i className="fas fa-list"></i>
              <div>
                <span className="summary-label">Tổng đã lấy</span>
                <span className="summary-value">{stats.total}</span>
              </div>
            </div>
            <div className="summary-item summary-valid">
              <i className="fas fa-plus-circle"></i>
              <div>
                <span className="summary-label">Sản phẩm mới</span>
                <span className="summary-value">{stats.fresh}</span>
              </div>
            </div>
            <div className="summary-item summary-warning">
              <i className="fas fa-check-double"></i>
              <div>
                <span className="summary-label">Đã có trong shop</span>
                <span className="summary-value">{stats.existing}</span>
              </div>
            </div>
          </div>

          <div className="akko-table-wrapper">
            <table className="akko-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Trạng thái</th>
                  <th>Tên sản phẩm</th>
                  <th>Giá gốc</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Ảnh</th>
                  <th>Nguồn Akko</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.name}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className={`status-badge ${row.status === 'new' ? 'status-new' : 'status-existing'}`}>
                        {row.status === 'new' ? 'Sản phẩm mới' : 'Đã có trong shop'}
                      </span>
                    </td>
                    <td className="col-name" title={row.name}>{row.name}</td>
                    <td>{row.original_price_vnd?.toLocaleString('vi-VN')} ₫</td>
                    <td>{row.price_vnd?.toLocaleString('vi-VN')} ₫</td>
                    <td>{row.stock_status === 'in_stock' ? 'Còn hàng' : 'Hết hàng'}</td>
                    <td>{row.images?.length ?? 0} ảnh</td>
                    <td>
                      <a href={row.source_url} target="_blank" rel="noreferrer">
                        Xem nguồn
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="akko-actions">
            {importing ? (
              <div className="import-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${importProgress}%` }}></div>
                </div>
                <p className="progress-text">
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang thêm sản phẩm mới... {importProgress}%
                </p>
              </div>
            ) : (
              <button className="btn-primary" onClick={handleRequestImport} disabled={stats.fresh === 0}>
                <i className="fas fa-database"></i>
                Thêm {stats.fresh} sản phẩm mới vào database
              </button>
            )}
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Xác nhận thêm sản phẩm mới"
        message={`Bạn có chắc muốn thêm ${stats.fresh} sản phẩm mới vào database?`}
        warningText={`Các sản phẩm đã có trong shop (${stats.existing}) sẽ không được thêm lại.`}
        icon="warning"
        primaryButtonLabel="Xác nhận thêm"
        secondaryButtonLabel="Hủy"
        onPrimaryAction={handleConfirmImport}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default AkkoKeyboardUpdater;