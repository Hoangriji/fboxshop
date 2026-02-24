import React, { useState } from 'react';
import { parseExcelFile, generateExcelTemplate, exportFailedRows, type ParsedProduct } from '../../../utils/excelHelper';
import { validateProducts, checkDuplicateSKUs, getValidProducts, getInvalidProducts, getValidationSummary, toCleanProduct } from '../../../utils/productImportValidation';
import { ProductsService } from '../../../services/firebaseService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import './ProductImport.css';

const ProductImport: React.FC = () => {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
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
        <button 
          className="btn-primary" 
          onClick={handleDownloadTemplate}
          disabled={importing}
        >
          <i className="fas fa-download"></i>
          <span>Tải file mẫu</span>
        </button>
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
                  <th className="col-digital">File số</th>
                  <th className="col-filesize">Kích thước</th>
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
                        {product.name || <span className="text-missing">-</span>}
                      </td>
                      <td className="col-type">{product.type || '-'}</td>
                      <td className="col-brand">{product.brand || '-'}</td>
                      <td className="col-category">{product.category || '-'}</td>
                      <td className="col-sku">{product.sku || '-'}</td>
                      <td className="col-price">
                        {product.original_price_vnd !== undefined 
                          ? product.original_price_vnd.toLocaleString('vi-VN') + ' ₫'
                          : <span className="text-muted">-</span>
                        }
                      </td>
                      <td className="col-price">
                        {product.price_vnd !== undefined 
                          ? product.price_vnd.toLocaleString('vi-VN') + ' ₫'
                          : <span className="text-missing">-</span>
                        }
                      </td>
                      <td className="col-stock">{product.stock !== undefined ? product.stock : '-'}</td>
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
                        {product.specs && typeof product.specs === 'object' && Object.keys(product.specs).length > 0
                          ? `${Object.keys(product.specs).length} thông số`
                          : '-'
                        }
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
                      <td className="col-digital" title={product.digital_file}>
                        {product.digital_file ? (
                          product.digital_file.length > 30
                            ? '...' + product.digital_file.substring(product.digital_file.length - 27)
                            : product.digital_file
                        ) : '-'}
                      </td>
                      <td className="col-filesize">{product.file_size || '-'}</td>
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
