import React, { useState, useEffect } from 'react';
import type { Product, Category } from '../../../types';
import { cloudinaryConfig } from '../../../config/cloudinary';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  product,
  categories 
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: '',
    price_vnd: 0,
    price_virtual: 0,
    stock_status: 'in_stock',
    featured: false,
    type: 'physical',
    is_free: false,
    images: [],
    tags: [],
    subcategory: '',
    features: [],
    specs: {}
  });
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [features, setFeatures] = useState<string[]>(['']);
  const [specs, setSpecs] = useState<Array<{key: string; value: string}>>([{key: '', value: ''}]);
  
  // Custom dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const categoryDropdownRef = React.useRef<HTMLDivElement>(null);
  const typeDropdownRef = React.useRef<HTMLDivElement>(null);
  const stockDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Check if Cloudinary is configured
  const isCloudinaryConfigured = cloudinaryConfig.cloudName && cloudinaryConfig.uploadPreset;

  useEffect(() => {
    if (product) {
      setFormData(product);
      setImageUrls(product.images.length > 0 ? product.images : ['']);
      setUploadedImages([]);
      setFeatures(product.features && product.features.length > 0 ? product.features : ['']);
      
      // Convert specs object to array format
      const specsArray = product.specs && Object.keys(product.specs).length > 0
        ? Object.entries(product.specs).map(([key, value]) => ({key, value}))
        : [{key: '', value: ''}];
      setSpecs(specsArray);
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price_vnd: 0,
        price_virtual: 0,
        stock_status: 'in_stock',
        featured: false,
        type: 'physical',
        is_free: false,
        images: [],
        tags: [],
        subcategory: '',
        features: [],
        specs: {}
      });
      setImageUrls(['']);
      setUploadedImages([]);
      setFeatures(['']);
      setSpecs([{key: '', value: ''}]);
    }
  }, [product]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
        setStockDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset || '');
        formData.append('folder', 'uside-shop/products');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Upload failed');
        }

        const data = await response.json();
        uploadedUrls.push(data.secure_url);
      }

      setUploadedImages(prev => [...prev, ...uploadedUrls]);
      alert(`Đã tải lên thành công ${uploadedUrls.length} ảnh!`);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`Có lỗi xảy ra khi tải ảnh lên: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleAddFeature = () => {
    setFeatures([...features, '']);
  };

  const handleRemoveFeature = (index: number) => {
    if (features.length > 1) {
      setFeatures(features.filter((_, i) => i !== index));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleAddSpec = () => {
    setSpecs([...specs, {key: '', value: ''}]);
  };

  const handleRemoveSpec = (index: number) => {
    if (specs.length > 1) {
      setSpecs(specs.filter((_, i) => i !== index));
    }
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const urlImages = imageUrls
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      // Combine uploaded images and URL images
      const images = [...uploadedImages, ...urlImages];

      // Filter out empty features
      const filteredFeatures = features
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Convert specs array to object, filter out empty entries
      const specsObj: Record<string, string> = {};
      specs.forEach(spec => {
        const key = spec.key.trim();
        const value = spec.value.trim();
        if (key && value) {
          specsObj[key] = value;
        }
      });

      await onSubmit({
        ...formData,
        images,
        features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
        specs: Object.keys(specsObj).length > 0 ? specsObj : undefined
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting product:', error);
      alert('Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <i className={`fas fa-${product ? 'edit' : 'plus'}`}></i>
            {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Tên sản phẩm *</label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên sản phẩm"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">Mô tả *</label>
              <textarea
                id="description"
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Danh mục *</label>
              <div className="custom-select-dropdown" ref={categoryDropdownRef}>
                <button
                  type="button"
                  className={`custom-select-btn ${categoryDropdownOpen ? 'open' : ''} ${!formData.category ? 'placeholder' : ''}`}
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                >
                  <span>{formData.category ? categories.find(c => c.id === formData.category)?.name : 'Chọn danh mục'}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {categoryDropdownOpen && (
                  <div className="custom-select-list">
                    {categories.map(cat => (
                      <div
                        key={cat.id}
                        className={`custom-select-option ${formData.category === cat.id ? 'selected' : ''}`}
                        onClick={() => {
                          setFormData({ ...formData, category: cat.id });
                          setCategoryDropdownOpen(false);
                        }}
                      >
                        <i className="fas fa-tag"></i>
                        <span>{cat.name}</span>
                        {formData.category === cat.id && <i className="fas fa-check"></i>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Loại sản phẩm *</label>
              <div className="custom-select-dropdown" ref={typeDropdownRef}>
                <button
                  type="button"
                  className={`custom-select-btn ${typeDropdownOpen ? 'open' : ''}`}
                  onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
                >
                  <span>{formData.type === 'physical' ? 'Vật lý' : 'Digital'}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {typeDropdownOpen && (
                  <div className="custom-select-list">
                    <div
                      className={`custom-select-option ${formData.type === 'physical' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, type: 'physical' });
                        setTypeDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-box"></i>
                      <span>Vật lý</span>
                      {formData.type === 'physical' && <i className="fas fa-check"></i>}
                    </div>
                    <div
                      className={`custom-select-option ${formData.type === 'digital' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, type: 'digital' });
                        setTypeDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-download"></i>
                      <span>Digital</span>
                      {formData.type === 'digital' && <i className="fas fa-check"></i>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="price_vnd">Giá (VNĐ) *</label>
              <input
                id="price_vnd"
                type="number"
                required
                min="0"
                value={formData.price_vnd}
                onChange={(e) => setFormData({ ...formData, price_vnd: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price_virtual">Giá Virtual (UPoints)</label>
              <input
                id="price_virtual"
                type="number"
                min="0"
                value={formData.price_virtual}
                onChange={(e) => setFormData({ ...formData, price_virtual: Number(e.target.value) })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label>Trạng thái kho *</label>
              <div className="custom-select-dropdown" ref={stockDropdownRef}>
                <button
                  type="button"
                  className={`custom-select-btn ${stockDropdownOpen ? 'open' : ''}`}
                  onClick={() => setStockDropdownOpen(!stockDropdownOpen)}
                >
                  <span>
                    {formData.stock_status === 'in_stock' && 'Còn hàng'}
                    {formData.stock_status === 'low_stock' && 'Sắp hết'}
                    {formData.stock_status === 'out_of_stock' && 'Hết hàng'}
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {stockDropdownOpen && (
                  <div className="custom-select-list">
                    <div
                      className={`custom-select-option ${formData.stock_status === 'in_stock' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, stock_status: 'in_stock' });
                        setStockDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-check-circle"></i>
                      <span>Còn hàng</span>
                      {formData.stock_status === 'in_stock' && <i className="fas fa-check"></i>}
                    </div>
                    <div
                      className={`custom-select-option ${formData.stock_status === 'low_stock' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, stock_status: 'low_stock' });
                        setStockDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Sắp hết</span>
                      {formData.stock_status === 'low_stock' && <i className="fas fa-check"></i>}
                    </div>
                    <div
                      className={`custom-select-option ${formData.stock_status === 'out_of_stock' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, stock_status: 'out_of_stock' });
                        setStockDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-times-circle"></i>
                      <span>Hết hàng</span>
                      {formData.stock_status === 'out_of_stock' && <i className="fas fa-check"></i>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {formData.type === 'digital' && (
              <div className="form-group">
                <label htmlFor="file_size">Kích thước file</label>
                <input
                  id="file_size"
                  type="text"
                  value={formData.file_size || ''}
                  onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
                  placeholder="VD: 25 MB"
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="images">Hình ảnh sản phẩm *</label>
              
              {/* Upload from device */}
              <div className="image-upload-section">
                <label 
                  htmlFor="file-upload" 
                  className={`file-upload-btn ${!isCloudinaryConfigured ? 'disabled' : ''}`}
                  title={!isCloudinaryConfigured ? 'Chưa cấu hình Cloudinary' : ''}
                >
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>{uploading ? 'Đang tải lên...' : 'Tải ảnh từ máy'}</span>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploading || !isCloudinaryConfigured}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploading && <i className="fas fa-spinner fa-spin" style={{ marginLeft: '10px' }}></i>}
                {!isCloudinaryConfigured && (
                  <small className="cloudinary-warning">
                    <i className="fas fa-exclamation-triangle"></i>
                    Chưa cấu hình Cloudinary. Vui lòng thêm <code>VITE_CLOUDINARY_CLOUD_NAME</code> và <code>VITE_CLOUDINARY_UPLOAD_PRESET</code> vào file <code>.env</code>
                  </small>
                )}
              </div>

              {/* URL input */}
              <div className="url-input-section">
                <label className="secondary-label">
                  Hoặc nhập URL hình ảnh
                </label>
                <div className="dynamic-inputs-container">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="dynamic-input-row">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder={`URL hình ảnh ${index + 1}: https://example.com/image${index + 1}.jpg`}
                        className="url-input"
                      />
                      {imageUrls.length > 1 && (
                        <button
                          type="button"
                          className="remove-input-btn"
                          onClick={() => handleRemoveImageUrl(index)}
                          title="Xóa URL"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-input-btn" onClick={handleAddImageUrl}>
                    <i className="fas fa-plus-circle"></i> Thêm URL
                  </button>
                </div>
              </div>

              {/* Preview all images (uploaded + URL) */}
              {(uploadedImages.length > 0 || imageUrls.some(url => url.trim())) && (
                <div className="all-images-preview">
                  <h4 className="preview-title">
                    <i className="fas fa-images"></i> Preview hình ảnh
                  </h4>
                  <div className="uploaded-images-preview">
                    {/* Uploaded images */}
                    {uploadedImages.map((url, index) => (
                      <div key={`uploaded-${index}`} className="image-preview-item">
                        <img src={url} alt={`Uploaded ${index + 1}`} />
                        <div className="image-badge">Đã tải lên</div>
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveUploadedImage(index)}
                          title="Xóa ảnh"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    
                    {/* URL images */}
                    {imageUrls.filter(url => url.trim()).map((url, index) => (
                      <div key={`url-${index}`} className="image-preview-item">
                        <img src={url.trim()} alt={`URL ${index + 1}`} onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Invalid+URL';
                        }} />
                        <div className="image-badge url-badge">URL</div>
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveImageUrl(imageUrls.indexOf(url))}
                          title="Xóa ảnh"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {uploadedImages.length === 0 && !imageUrls.some(url => url.trim()) && (
                <small className="warning-text">* Vui lòng tải ảnh lên hoặc nhập URL hình ảnh</small>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="form-section">
            <h3 className="form-section-title highlighted-title">
              <i className="fas fa-check-circle"></i>
              Tính năng nổi bật
              <span className="optional-badge">Tùy chọn</span>
            </h3>
            <div className="dynamic-inputs-container">
              {features.map((feature, index) => (
                <div key={index} className="dynamic-input-row">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleFeatureChange(index, e.target.value)}
                    placeholder={`Tính năng ${index + 1}: VD: Đèn RGB với 16 triệu màu sắc`}
                    className="feature-input"
                  />
                  {features.length > 1 && (
                    <button
                      type="button"
                      className="remove-input-btn"
                      onClick={() => handleRemoveFeature(index)}
                      title="Xóa tính năng"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-input-btn" onClick={handleAddFeature}>
                <i className="fas fa-plus-circle"></i> Thêm tính năng
              </button>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="form-section">
            <h3 className="form-section-title highlighted-title">
              <i className="fas fa-cog"></i>
              Thông số kỹ thuật
              <span className="optional-badge">Tùy chọn</span>
            </h3>
            <div className="dynamic-inputs-container">
              {specs.map((spec, index) => (
                <div key={index} className="dynamic-input-row spec-row">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    placeholder="Tên thông số (VD: Pin)"
                    className="spec-key-input"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    placeholder="Giá trị (VD: 8000mAh)"
                    className="spec-value-input"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      className="remove-input-btn"
                      onClick={() => handleRemoveSpec(index)}
                      title="Xóa thông số"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="add-input-btn" onClick={handleAddSpec}>
                <i className="fas fa-plus-circle"></i> Thêm thông số
              </button>
            </div>
          </div>

          <div className="form-row form-checkboxes">
            <div className="form-checkbox">
              <input
                id="featured"
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              />
              <label htmlFor="featured">
                <i className="fas fa-star"></i> Sản phẩm nổi bật
              </label>
            </div>

            {formData.type === 'digital' && (
              <div className="form-checkbox">
                <input
                  id="is_free"
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                />
                <label htmlFor="is_free">
                  <i className="fas fa-gift"></i> Miễn phí
                </label>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Đang lưu...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {product ? 'Cập nhật' : 'Thêm mới'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
