import React, { useState } from 'react';
import { parseExcelFile, generateExcelTemplate, exportFailedRows, exportProductsToExcel, type ParsedProduct } from '../../../utils/excelHelper';
import { validateProducts, checkDuplicateSKUs, getValidProducts, getInvalidProducts, getValidationSummary, toCleanProduct } from '../../../utils/productImportValidation';
import { ProductsService } from '../../../services/firebaseService';
import { ActivityLogsService } from '../../../services/activityLogsService';
import { useProducts } from '../../../hooks/useProducts';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import './ProductImport.css';

const ProductImport: React.FC = () => {
  const { products: dbProducts } = useProducts();
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportingDb, setExportingDb] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Handle file selection/drop
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Process Excel file
  const processFile = async (selectedFile: File) => {
    setError(null);
    setSuccess(null);
    
    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidType) {
      setError('Chỉ chấp nhận file Excel (.xlsx, .xls)');
      return;
    }

    setParsing(true);

    try {
      // Parse Excel file
      const products = await parseExcelFile(selectedFile);
      
      if (products.length === 0) {
        setError('File Excel không có dữ liệu hoặc định dạng không đúng');
        setParsing(false);
        return;
      }

      // Validate products
      let validatedProducts = validateProducts(products);
      
      // Check duplicate SKUs
      validatedProducts = checkDuplicateSKUs(validatedProducts);

      setParsedProducts(validatedProducts);
      setShowPreview(true);
      setParsing(false);

      const summary = getValidationSummary(validatedProducts);
      if (summary.invalid > 0) {
        setError(`Tìm thấy ${summary.invalid} dòng có lỗi. Vui lòng kiểm tra và sửa trước khi import.`);
      } else {
        setSuccess(`Đã đọc thành công ${summary.valid} sản phẩm. Kiểm tra và nhấn "Nhập sản phẩm" để lưu.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đọc file Excel');
      setParsing(false);
    }
  };

  // Show confirmation modal
  const handleImport = () => {
    const validProducts = getValidProducts(parsedProducts);
    
    if (validProducts.length === 0) {
      setError('Không có sản phẩm hợp lệ để import');
      return;
    }

    setShowConfirmModal(true);
  };

  // Import products to Firebase after confirmation
  const handleConfirmImport = async () => {
    setShowConfirmModal(false);
    const validProducts = getValidProducts(parsedProducts);

    setImporting(true);
    setImportProgress(0);
    setError(null);

    try {
      // Convert to clean products
      const cleanProducts = validProducts.map(toCleanProduct);
      
      // Bulk create
      const result = await ProductsService.bulkCreateProducts(
        cleanProducts,
        (current, total) => {
          setImportProgress(Math.round((current / total) * 100));
        }
      );

      setImporting(false);

      if (result.failed.length > 0) {
        setError(`Nhập thành công ${result.success.length} sản phẩm. ${result.failed.length} sản phẩm thất bại.`);
      } else {
        setSuccess(`Nhập thành công ${result.success.length} sản phẩm!`);
        
        // Reset after success
        setTimeout(() => {
          handleReset();
        }, 3000);
      }
    } catch (err) {
      setImporting(false);
      setError(err instanceof Error ? err.message : 'Lỗi khi import sản phẩm');
    }
  };

  // Download Excel template
  const handleDownloadTemplate = () => {
    generateExcelTemplate();
  };

  // Export all current DB products to Excel
  const handleExportDbProducts = async () => {
    if (!dbProducts || dbProducts.length === 0) {
      setError('Cơ sở dữ liệu chưa có sản phẩm nào để xuất.');
      return;
    }

    try {
      setExportingDb(true);
      setError(null);
      exportProductsToExcel(dbProducts);

      try {
        await ActivityLogsService.addLog({
          action: 'export',
          productId: 'import_page_export',
          productName: `Xuất Excel từ trang Import (${dbProducts.length} sản phẩm)`,
          timestamp: new Date().toISOString(),
          details: `Đã xuất ${dbProducts.length} sản phẩm hiện có ra file Excel`
        });
      } catch (logErr) {
        console.warn('Could not log export activity:', logErr);
      }

      setSuccess(`Đã xuất thành công ${dbProducts.length} sản phẩm hiện có trong cơ sở dữ liệu ra file Excel!`);
      setExportingDb(false);
    } catch (err) {
      setExportingDb(false);
      setError(err instanceof Error ? err.message : 'Lỗi khi xuất sản phẩm ra file Excel.');
    }
  };

  // Export failed rows
  const handleExportFailed = () => {
    const invalidProducts = getInvalidProducts(parsedProducts);
    if (invalidProducts.length === 0) {
      setError('Không có dòng lỗi để export');
      return;
    }
    exportFailedRows(invalidProducts);
  };

  // Reset form
  const handleReset = () => {
    setParsedProducts([]);
    setShowPreview(false);
    setError(null);
    setSuccess(null);
    setImportProgress(0);
  };

  const summary = parsedProducts.length > 0 ? getValidationSummary(parsedProducts) : null;

  return (
    <div className="product-import">
      <div className="page-header">
        <h2>
          <i className="fas fa-file-import"></i>
          Nhập sản phẩm từ Excel
        </h2>
        <div className="header-actions">
          <button 
            type="button"
            className="btn-export-excel"
            onClick={handleExportDbProducts}
            disabled={importing || exportingDb}
            title="Xuất toàn bộ danh sách sản phẩm hiện có trong cơ sở dữ liệu ra file Excel"
          >
            <i className={exportingDb ? "fas fa-spinner fa-spin" : "fas fa-file-excel"}></i>
            <span>{exportingDb ? 'Đang xuất...' : `Xuất SP trong DB (${dbProducts.length})`}</span>
          </button>
          <button 
            type="button"
            className="btn-primary" 
            onClick={handleDownloadTemplate}
            disabled={importing}
          >
            <i className="fas fa-download"></i>
            <span>Tải file mẫu</span>
          </button>
        </div>
      </div>

      <p className="page-description">
        Tải lên file Excel để nhập hàng loạt sản phẩm vào hệ thống
      </p>

      {/* Upload Section */}
      {!showPreview && (
        <div 
          className="upload-section"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="upload-dragger">
            <div className="upload-icon">
              <i className="fas fa-cloud-upload-alt"></i>
            </div>
            <p className="upload-text">
              Kéo thả file Excel vào đây hoặc
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={parsing || importing}
              style={{ display: 'none' }}
              id="excel-file-input"
            />
            <label htmlFor="excel-file-input" className="btn-select-file-label">
              <span className="btn-select-file btn-primary">
                Chọn file
              </span>
            </label>
            <p className="upload-hint">
              Hỗ trợ file .xlsx, .xls (tối đa 10MB)
            </p>
          </div>

          {parsing && (
            <div className="parsing-loader">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang đọc file Excel...</p>
            </div>
          )}

          {/* Quick Guide Cards for all Categories */}
          <div className="import-guide-grid">
            <div className="import-guide-card">
              <h4>
                <i className="fas fa-tv" style={{ color: '#00d2ff' }}></i>
                Màn hình & Bàn phím (Monitor & Keyboard)
              </h4>
              <ul>
                <li><strong>Màn hình (<code>monitor</code>):</strong> Hỗ trợ cột riêng: <code>Kích thước màn hình</code> (27 inch), <code>Độ phân giải</code> (2K, 4K), <code>Tần số quét</code> (75Hz, 144Hz), <code>Tấm nền</code> (IPS, OLED), <code>Cổng kết nối</code>.</li>
                <li><strong>Bàn phím (<code>keyboard</code>):</strong> Dành cho các hãng ngoài Akko (ASUS ROG, Keychron, Logitech...). Cột riêng: <code>Loại bàn phím</code> (75%, TKL, 65%), <code>Đèn LED</code> (RGB), <code>Kết nối</code>, <code>Tương thích</code>.</li>
                <li>Tất cả tự động đồng bộ sang bộ lọc danh mục và chi tiết sản phẩm.</li>
              </ul>
            </div>

            <div className="import-guide-card">
              <h4>
                <i className="fas fa-headphones" style={{ color: '#a855f7' }}></i>
                Tai nghe & Chuột (Headset & Mouse)
              </h4>
              <ul>
                <li><strong>Tai nghe (<code>headset</code>):</strong> Cột riêng: <code>Loại tai nghe</code> (Over-ear chụp tai, In-ear, Wireless), <code>Nhu cầu sử dụng</code> (Gaming, Studio, Văn phòng), <code>Cổng kết nối</code>.</li>
                <li><strong>Chuột (<code>mouse</code>):</strong> Cột riêng: <code>Kết nối</code> (Wireless 2.4GHz, Bluetooth, Type-C), <code>Đèn LED</code>, <code>DPI</code>, <code>Cảm biến</code>, <code>Trọng lượng</code>.</li>
              </ul>
            </div>

            <div className="import-guide-card">
              <h4>
                <i className="fas fa-hdd" style={{ color: '#f59e0b' }}></i>
                USB / Lưu trữ & Phụ kiện (USB & Other)
              </h4>
              <ul>
                <li><strong>USB & Lưu trữ (<code>usb</code>):</strong> Cột riêng: <code>Dung lượng</code> (128GB, 1TB), <code>Loại USB</code> (USB 3.2, Type-C), <code>Tốc độ đọc</code>, <code>Tốc độ ghi</code>, <code>Loại thẻ nhớ</code>.</li>
                <li><strong>Sản phẩm khác (<code>other</code>):</strong> Lót chuột (Deskpad), Giá treo Arm màn hình, Kê tay. Cột riêng: <code>Loại sản phẩm phụ</code>, <code>Chất liệu</code>.</li>
              </ul>
            </div>

            <div className="import-guide-card">
              <h4>
                <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                Quy cách nhập dữ liệu chung
              </h4>
              <ul>
                <li><strong>Bắt buộc:</strong> <code>Tên sản phẩm</code> và <code>Giá bán (VND)</code> là 2 trường bắt buộc.</li>
                <li><strong>Định dạng giá:</strong> Nhập số nguyên hoặc có dấu chấm phân cách (VD: <code>9890000</code> hoặc <code>9.890.000đ</code>).</li>
                <li><strong>Tính năng & Thông số:</strong> Ngăn cách bằng dấu chấm phẩy <code>;</code>.</li>
                <li><strong>Hình ảnh:</strong> Ngăn cách nhiều URL bằng dấu phẩy <code>,</code> hoặc xuống dòng.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
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

      {/* Preview Section */}
      {showPreview && parsedProducts.length > 0 && (
        <div className="preview-section">
          <div className="preview-header">
            <h3>
              <i className="fas fa-table"></i>
              Xem trước dữ liệu ({parsedProducts.length} dòng)
            </h3>
            <div className="preview-actions">
              {summary && summary.invalid > 0 && (
                <button 
                  className="btn-export-failed" 
                  onClick={handleExportFailed}
                  disabled={importing}
                >
                  <i className="fas fa-file-excel"></i>
                  Export lỗi ({summary.invalid})
                </button>
              )}
              <button 
                className="btn-reset" 
                onClick={handleReset}
                disabled={importing}
              >
                <i className="fas fa-times"></i>
                Hủy
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="import-summary">
              <div className="summary-item summary-total">
                <i className="fas fa-file-alt"></i>
                <div>
                  <span className="summary-label">Tổng số</span>
                  <span className="summary-value">{summary.total}</span>
                </div>
              </div>
              <div className="summary-item summary-valid">
                <i className="fas fa-check-circle"></i>
                <div>
                  <span className="summary-label">Hợp lệ</span>
                  <span className="summary-value">{summary.valid}</span>
                </div>
              </div>
              <div className="summary-item summary-invalid">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <span className="summary-label">Lỗi</span>
                  <span className="summary-value">{summary.invalid}</span>
                </div>
              </div>
              <div className="summary-item summary-warning">
                <i className="fas fa-info-circle"></i>
                <div>
                  <span className="summary-label">Cảnh báo</span>
                  <span className="summary-value">{summary.withWarnings}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview Table */}
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  <th className="col-row">Dòng</th>
                  <th className="col-status">Trạng thái</th>
                  <th className="col-name">Tên sản phẩm</th>
                  <th className="col-type">Loại</th>
                  <th className="col-brand">Thương hiệu</th>
                  <th className="col-category">Danh mục</th>
                  <th className="col-sku">SKU</th>
                  <th className="col-price">Giá gốc</th>
                  <th className="col-price">Giá bán</th>
                  <th className="col-stock">Tồn kho</th>
                  <th className="col-description">Mô tả</th>
                  <th className="col-features">Tính năng</th>
                  <th className="col-specs">Thông số KT</th>
                  <th className="col-tags">Tags</th>
                  <th className="col-images">Hình ảnh</th>
                  {/* ẩn digital */}
                  {/* <th className="col-digital">File số</th> */}
                  {/* <th className="col-filesize">Kích thước</th> */}
                  <th className="col-messages">Lỗi / Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {parsedProducts.map((product, index) => {
                  const hasErrors = (product._errors?.length ?? 0) > 0;
                  const hasWarnings = (product._warnings?.length ?? 0) > 0;
                  const rowClass = hasErrors ? 'row-error' : hasWarnings ? 'row-warning' : 'row-success';

                  return (
                    <tr key={index} className={rowClass}>
                      <td className="col-row">{product._row}</td>
                      <td className="col-status">
                        {hasErrors ? (
                          <span className="status-badge status-error">
                            <i className="fas fa-times-circle"></i> Lỗi
                          </span>
                        ) : hasWarnings ? (
                          <span className="status-badge status-warning">
                            <i className="fas fa-exclamation-triangle"></i> Cảnh báo
                          </span>
                        ) : (
                          <span className="status-badge status-success">
                            <i className="fas fa-check-circle"></i> OK
                          </span>
                        )}
                      </td>
                      <td className="col-name" title={product.name}>
                        <div className="product-name-cell">
                          <span className="product-name-text">{product.name || <span className="text-missing">-</span>}</span>
                          
                          {/* Monitor mini-badges */}
                          {product.category === 'monitor' && (product.screen_size || product.resolution || product.panel_type) && (
                            <div className="monitor-mini-badges">
                              {product.screen_size && <span className="mini-badge-screen">{product.screen_size}</span>}
                              {product.resolution && <span className="mini-badge-res">{product.resolution}</span>}
                              {product.panel_type && <span className="mini-badge-panel">{product.panel_type}</span>}
                              {product.refresh_rate && <span className="mini-badge-hz">{product.refresh_rate}</span>}
                            </div>
                          )}

                          {/* Keyboard mini-badges */}
                          {product.category === 'keyboard' && (product.form_factor || product.led_type) && (
                            <div className="monitor-mini-badges">
                              {product.form_factor && <span className="mini-badge-screen">{product.form_factor}</span>}
                              {product.led_type && <span className="mini-badge-panel">{product.led_type}</span>}
                              {product.connection_types?.[0] && <span className="mini-badge-hz">{product.connection_types[0]}</span>}
                            </div>
                          )}

                          {/* Headset mini-badges */}
                          {product.category === 'headset' && (product.headset_type || product.use_cases?.[0]) && (
                            <div className="monitor-mini-badges">
                              {product.headset_type && <span className="mini-badge-screen">{product.headset_type}</span>}
                              {product.use_cases?.[0] && <span className="mini-badge-res">{product.use_cases[0]}</span>}
                            </div>
                          )}

                          {/* USB mini-badges */}
                          {product.category === 'usb' && (product.storage_capacity || product.usb_type) && (
                            <div className="monitor-mini-badges">
                              {product.storage_capacity && <span className="mini-badge-screen">{product.storage_capacity}</span>}
                              {product.usb_type && <span className="mini-badge-panel">{product.usb_type}</span>}
                            </div>
                          )}

                          {/* Other product mini-badges */}
                          {product.category === 'other' && (product.product_type || product.material) && (
                            <div className="monitor-mini-badges">
                              {product.product_type && <span className="mini-badge-screen">{product.product_type}</span>}
                              {product.material && <span className="mini-badge-res">{product.material}</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="col-type">{product.type || '-'}</td>
                      <td className="col-brand">{product.brand || '-'}</td>
                      <td className="col-category">
                        <span className={`cat-pill cat-${product.category}`}>
                          {product.category === 'monitor' 
                            ? 'Màn hình' 
                            : product.category === 'keyboard' 
                            ? 'Bàn phím' 
                            : product.category === 'mouse' 
                            ? 'Chuột' 
                            : product.category === 'headset' 
                            ? 'Tai nghe'
                            : product.category === 'usb' || product.category === 'usb-storage'
                            ? 'USB & Phụ kiện'
                            : product.category === 'other'
                            ? 'Sản phẩm khác'
                            : product.category === 'digital'
                            ? 'Tài liệu số'
                            : product.category || '-'}
                        </span>
                      </td>
                      <td className="col-sku">{product.sku || '-'}</td>
                      <td className="col-price">
                        {product.original_price_vnd !== undefined && product.original_price_vnd > 0
                          ? product.original_price_vnd.toLocaleString('vi-VN') + ' ₫'
                          : (product.price_vnd !== undefined
                              ? product.price_vnd.toLocaleString('vi-VN') + ' ₫'
                              : <span className="text-muted">-</span>)
                        }
                      </td>
                      <td className="col-price">
                        {product.price_vnd !== undefined 
                          ? product.price_vnd.toLocaleString('vi-VN') + ' ₫'
                          : <span className="text-missing">-</span>
                        }
                      </td>
                      <td className="col-stock">
                        {product.stock !== undefined ? (
                          <span className={product.stock === 0 ? 'text-danger' : 'text-success'}>
                            {product.stock} ({product.stock_status === 'out_of_stock' ? 'Liên hệ' : 'Còn hàng'})
                          </span>
                        ) : (
                          <span>{product.stock_status === 'out_of_stock' ? 'Liên hệ' : 'Còn hàng'}</span>
                        )}
                      </td>
                      <td className="col-description" title={product.description}>
                        {product.description ? (
                          product.description.length > 50 
                            ? product.description.substring(0, 50) + '...' 
                            : product.description
                        ) : '-'}
                      </td>
                      <td className="col-features">
                        {Array.isArray(product.features) && product.features.length > 0 
                          ? `${product.features.length} tính năng` 
                          : '-'
                        }
                      </td>
                      <td className="col-specs">
                        {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0 ? (
                          <span 
                            className="specs-badge" 
                            title={Object.entries(product.specs).map(([k, v]) => `${k}: ${v}`).join('\n')}
                          >
                            <i className="fas fa-microchip"></i> {Object.keys(product.specs).length} thông số
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="col-tags">
                        {Array.isArray(product.tags) && product.tags.length > 0
                          ? product.tags.slice(0, 2).join(', ') + (product.tags.length > 2 ? '...' : '')
                          : '-'
                        }
                      </td>
                      <td className="col-images">
                        {Array.isArray(product.images) && product.images.length > 0
                          ? `${product.images.length} ảnh`
                          : '-'
                        }
                      </td>
                      {/* ẩn digital */}
                      {/*
                      <td className="col-digital" title={product.digital_file}>
                        {product.digital_file ? (
                          product.digital_file.length > 30
                            ? '...' + product.digital_file.substring(product.digital_file.length - 27)
                            : product.digital_file
                        ) : '-'}
                      </td>
                      <td className="col-filesize">{product.file_size || '-'}</td>
                      */}
                      <td className="col-messages">
                        {hasErrors && (
                          <div className="messages-list">
                            {product._errors?.map((err, i) => (
                              <div key={i} className="message-item message-error-item">
                                <i className="fas fa-times-circle"></i> {err}
                              </div>
                            ))}
                          </div>
                        )}
                        {hasWarnings && (
                          <div className="messages-list">
                            {product._warnings?.map((warn, i) => (
                              <div key={i} className="message-item message-warning-item">
                                <i className="fas fa-exclamation-triangle"></i> {warn}
                              </div>
                            ))}
                          </div>
                        )}
                        {!hasErrors && !hasWarnings && <span className="text-muted">Không có</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import Actions */}
          <div className="import-actions">
            {importing ? (
              <div className="import-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  <i className="fas fa-spinner fa-spin"></i>
                  Đang nhập sản phẩm... {importProgress}%
                </p>
              </div>
            ) : (
              <button 
                className="btn-import" 
                onClick={handleImport}
                disabled={!summary || summary.valid === 0 || importing}
              >
                <i className="fas fa-upload"></i>
                Nhập {summary?.valid || 0} sản phẩm vào hệ thống
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Xác nhận nhập sản phẩm"
        message={`Bạn có chắc muốn nhập ${summary?.valid || 0} sản phẩm vào hệ thống?`}
        warningText={summary && summary.invalid > 0 ? `${summary.invalid} sản phẩm không hợp lệ sẽ bị bỏ qua` : undefined}
        icon="warning"
        primaryButtonLabel="Xác nhận nhập"
        secondaryButtonLabel="Hủy"
        onPrimaryAction={handleConfirmImport}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
};

export default ProductImport;
