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
  
  // Filter fields state
  const [brand, setBrand] = useState('');
  const [connectionTypes, setConnectionTypes] = useState<string[]>([]);
  const [compatibility, setCompatibility] = useState<string[]>([]);
  const [formFactor, setFormFactor] = useState('');
  const [ledType, setLedType] = useState('');
  const [dpi, setDpi] = useState('');
  const [sensor, setSensor] = useState('');
  const [buttons, setButtons] = useState('');
  const [driverSize, setDriverSize] = useState('');
  const [frequency, setFrequency] = useState('');
  const [impedance, setImpedance] = useState('');
  const [productFeatures, setProductFeatures] = useState<string[]>([]);
  
  // Error modal state
  const [errorModal, setErrorModal] = useState<{isOpen: boolean; title: string; message: string}>({isOpen: false, title: '', message: ''});
  
  const CATEGORY_FILTERS: Record<string, {
    brand?: boolean;
    formFactor?: boolean;
    connection?: boolean;
    compatibility?: boolean;
    led?: boolean;
    driverSize?: boolean;
    frequency?: boolean;
    impedance?: boolean;
    dpi?: boolean;
    sensor?: boolean;
    buttons?: boolean;
    features?: boolean;
  }> = {
    'keyboard': {
      brand: true,
      formFactor: true,
      connection: true,
      compatibility: true,
      led: true
    },
    'mouse': {
      brand: true,
      dpi: true,
      sensor: true,
      buttons: true,
      connection: true,
      led: true
    },
    'headset': {
      brand: true,
      connection: true,
      driverSize: true,
      frequency: true,
      impedance: true,
      compatibility: true
    },
    'monitor': {
      brand: true,
      features: true
    },
    'usb': {
      brand: true,
      connection: true
    },
    'digital': {
      brand: true
    },
    'other': {
      brand: true
    }
  };
  
  const BRAND_OPTIONS = ['Logitech', 'Razer', 'Corsair', 'SteelSeries', 'HyperX', 'Akko', 'Dareu', 'Keychron', 'Leopold', 'Filco', 'Asus', 'MSI', 'LG', 'Samsung', 'Dell', 'ViewSonic', 'BenQ', 'Acer', 'HP', 'Lenovo', 'Apple', 'Microsoft', 'Sandisk', 'Kingston', 'WD', 'Seagate'];
  const FORM_FACTOR_OPTIONS = ['Full-size (100%)', 'TKL (80%)', '75%', '65%', '60%', '40%', 'Compact', 'Ergonomic'];
  const CONNECTION_OPTIONS = ['Wired', 'Wireless 2.4GHz', 'Bluetooth', 'USB-C', 'USB-A', 'PS/2', 'Dual Mode'];
  const COMPATIBILITY_OPTIONS = ['Windows', 'MacOS', 'Linux', 'iOS', 'Android', 'PlayStation', 'Xbox', 'Nintendo Switch'];
  const LED_OPTIONS = ['RGB', 'Single Color', 'White LED', 'No LED', 'Per-key RGB', 'Zone RGB'];
  const DPI_OPTIONS = ['800', '1600', '3200', '6400', '12800', '16000', '25600'];
  const SENSOR_OPTIONS = ['Optical', 'Laser', 'Infrared'];
  const BUTTONS_OPTIONS = ['3', '5', '6', '7', '8', '10+'];
  const DRIVER_SIZE_OPTIONS = ['30mm', '40mm', '50mm', '53mm'];
  const FEATURES_OPTIONS = ['Tích hợp webcam', 'Tích hợp loa', 'Màn hình cong', 'Chống nhìn trộm', 'Màn hình cảm ứng'];
  
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
      
      // Load filter fields
      setBrand(product.brand || '');
      setConnectionTypes(product.connection_types || []);
      setCompatibility(product.compatibility || []);
      setFormFactor(product.form_factor || '');
      setLedType(product.led_type || '');
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
      setBrand('');
      setConnectionTypes([]);
      setCompatibility([]);
      setFormFactor('');
      setLedType('');
    }
  }, [product, isOpen]); // Add isOpen to dependencies

  // Reset all state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset form data
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
      setBrand('');
      setConnectionTypes([]);
      setCompatibility([]);
      setFormFactor('');
      setLedType('');
      setDpi('');
      setSensor('');
      setButtons('');
      setDriverSize('');
      setFrequency('');
      setImpedance('');
      setProductFeatures([]);
    }
  }, [isOpen]);

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

    // Validate file sizes (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    for (const file of Array.from(files)) {
      if (file.size > maxSize) {
        setErrorModal({
          isOpen: true,
          title: 'Kích thước ảnh vượt quá giới hạn',
          message: `Ảnh "${file.name}" có kích thước ${(file.size / 1024 / 1024).toFixed(2)}MB, vượt quá giới hạn cho phép là 5MB. Vui lòng chọn ảnh nhỏ hơn hoặc nén ảnh trước khi tải lên.`
        });
        e.target.value = '';
        return;
      }
    }

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
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrorModal({
        isOpen: true,
        title: 'Lỗi tải ảnh lên',
        message: `Có lỗi xảy ra khi tải ảnh lên: ${error instanceof Error ? error.message : 'Lỗi không xác định'}. Vui lòng thử lại.`
      });
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
    
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      setErrorModal({isOpen: true, title: 'Thiếu thông tin', message: 'Vui lòng nhập tên sản phẩm'});
      return;
    }
    if (!formData.description || !formData.description.trim()) {
      setErrorModal({isOpen: true, title: 'Thiếu thông tin', message: 'Vui lòng nhập mô tả sản phẩm'});
      return;
    }
    if (!formData.category) {
      setErrorModal({isOpen: true, title: 'Thiếu thông tin', message: 'Vui lòng chọn danh mục sản phẩm'});
      return;
    }
    if (formData.price_vnd !== undefined && formData.price_vnd < 0) {
      setErrorModal({isOpen: true, title: 'Dữ liệu không hợp lệ', message: 'Giá sản phẩm không được là số âm'});
      return;
    }
    if (formData.original_price_vnd !== undefined && formData.original_price_vnd < 0) {
      setErrorModal({isOpen: true, title: 'Dữ liệu không hợp lệ', message: 'Giá gốc không được là số âm'});
      return;
    }
    if (formData.original_price_vnd && formData.price_vnd && formData.original_price_vnd < formData.price_vnd) {
      setErrorModal({isOpen: true, title: 'Dữ liệu không hợp lệ', message: 'Giá gốc phải lớn hơn hoặc bằng giá bán'});
      return;
    }
    
    setLoading(true);

    try {
      const urlImages = imageUrls
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      // Combine uploaded images and URL images
      const images = [...uploadedImages, ...urlImages];
      
      // Validate at least one image
      if (images.length === 0) {
        setErrorModal({isOpen: true, title: 'Thiếu hình ảnh', message: 'Vui lòng thêm ít nhất một hình ảnh sản phẩm'});
        setLoading(false);
        return;
      }

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

      // Build product data with filter fields
      const productData: Partial<Product> = {
        ...formData,
        images,
        features: filteredFeatures.length > 0 ? filteredFeatures : undefined,
        specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
        brand: brand.trim() || undefined,
        connection_types: connectionTypes.length > 0 ? connectionTypes : undefined,
        compatibility: compatibility.length > 0 ? compatibility : undefined,
        form_factor: formFactor.trim() || undefined,
        led_type: ledType.trim() || undefined,
      };

      await onSubmit(productData);
      onClose();
    } catch (error) {
      console.error('Error submitting product:', error);
      setErrorModal({isOpen: true, title: 'Lỗi lưu sản phẩm', message: 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng thử lại.'});
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
                        // Reset category when changing type
                        setFormData({ ...formData, type: 'physical', category: '' });
                        setTypeDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-box"></i>
                      <span>Vật lý</span>
                      {formData.type === 'physical' && <i className="fas fa-check"></i>}
                    </div>
                    {/* ẩn digital */}
                    {/*
                    <div
                      className={`custom-select-option ${formData.type === 'digital' ? 'selected' : ''}`}
                      onClick={() => {
                        // Reset category when changing type
                        setFormData({ ...formData, type: 'digital', category: '' });
                        setTypeDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-download"></i>
                      <span>Digital</span>
                      {formData.type === 'digital' && <i className="fas fa-check"></i>}
                    </div>
                    */}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Danh mục *</label>
              <div className="custom-select-dropdown" ref={categoryDropdownRef}>
                <button
                  type="button"
                  className={`custom-select-btn ${categoryDropdownOpen ? 'open' : ''} ${!formData.category ? 'placeholder' : ''}`}
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  disabled={!formData.type}
                >
                  <span>{formData.category ? categories.find(c => c.id === formData.category)?.name : formData.type ? 'Chọn danh mục' : 'Chọn loại sản phẩm trước'}</span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {categoryDropdownOpen && (
                  <div className="custom-select-list">
                    {categories
                      .filter(cat => cat.type === formData.type)
                      .map(cat => (
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
                    {categories.filter(cat => cat.type === formData.type).length === 0 && (
                      <div className="custom-select-option disabled">
                        <i className="fas fa-info-circle"></i>
                        <span>Không có danh mục nào cho loại này</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="original_price_vnd">Giá ban đầu (VNĐ)</label>
              <input
                id="original_price_vnd"
                type="number"
                min="0"
                value={formData.original_price_vnd || ''}
                onChange={(e) => setFormData({ ...formData, original_price_vnd: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Không bắt buộc"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price_vnd">Giá hiện tại (VNĐ) *</label>
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
                    {formData.stock_status === 'out_of_stock' ? 'Liên hệ' : 'Còn hàng'}
                  </span>
                  <i className="fas fa-chevron-down"></i>
                </button>
                
                {stockDropdownOpen && (
                  <div className="custom-select-list">
                    <div
                      className={`custom-select-option ${formData.stock_status !== 'out_of_stock' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, stock_status: 'in_stock' });
                        setStockDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-check-circle"></i>
                      <span>Còn hàng</span>
                      {formData.stock_status !== 'out_of_stock' && <i className="fas fa-check"></i>}
                    </div>
                    <div
                      className={`custom-select-option ${formData.stock_status === 'out_of_stock' ? 'selected' : ''}`}
                      onClick={() => {
                        setFormData({ ...formData, stock_status: 'out_of_stock' });
                        setStockDropdownOpen(false);
                      }}
                    >
                      <i className="fas fa-phone-alt"></i>
                      <span>Liên hệ</span>
                      {formData.stock_status === 'out_of_stock' && <i className="fas fa-check"></i>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ẩn digital */}
            {/*
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
            */}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="images">
                Hình ảnh sản phẩm *
                <span className="image-size-limit">
                  <i className="fas fa-info-circle"></i>
                  Giới hạn: 5MB/ảnh
                </span>
              </label>
              
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

          {/* Filter Fields Section */}
          <div className="product-form-filter-section">
            <h3 className="product-form-filter-title">
              <i className="fas fa-sliders-h"></i>
              Thuộc tính bộ lọc
              <span className="product-form-filter-badge">Tùy chọn - Giúp khách hàng lọc sản phẩm</span>
            </h3>
            
            {!formData.category ? (
              <div className="product-form-filter-placeholder">
                <i className="fas fa-info-circle"></i>
                <p>Vui lòng chọn danh mục sản phẩm trước</p>
              </div>
            ) : (() => {
              const categoryFilter = CATEGORY_FILTERS[formData.category as string];
              if (!categoryFilter) {
                return (
                  <div className="product-form-filter-placeholder">
                    <i className="fas fa-info-circle"></i>
                    <p>Danh mục này chưa có bộ lọc thuộc tính</p>
                  </div>
                );
              }
              
              return (
                <>
                  {categoryFilter.brand && (
                    <div className="product-form-filter-row">
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="brand">
                          <i className="fas fa-tag"></i> Thương hiệu
                        </label>
                        <select className="product-form-filter-select" id="brand" value={brand} onChange={(e) => setBrand(e.target.value)}>
                          <option value="">Chọn thương hiệu</option>
                          {BRAND_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="product-form-filter-row product-form-filter-row-grid">
                    {categoryFilter.formFactor && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="form_factor">
                          <i className="fas fa-ruler"></i> Kích thước / Form Factor
                        </label>
                        <select className="product-form-filter-select" id="form_factor" value={formFactor} onChange={(e) => setFormFactor(e.target.value)}>
                          <option value="">Chọn kích thước</option>
                          {FORM_FACTOR_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {categoryFilter.dpi && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="dpi">
                          <i className="fas fa-crosshairs"></i> DPI
                        </label>
                        <select className="product-form-filter-select" id="dpi" value={dpi} onChange={(e) => setDpi(e.target.value)}>
                          <option value="">Chọn DPI</option>
                          {DPI_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {categoryFilter.sensor && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="sensor">
                          <i className="fas fa-microchip"></i> Loại cảm biến
                        </label>
                        <select className="product-form-filter-select" id="sensor" value={sensor} onChange={(e) => setSensor(e.target.value)}>
                          <option value="">Chọn cảm biến</option>
                          {SENSOR_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {categoryFilter.buttons && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="buttons">
                          <i className="fas fa-hand-pointer"></i> Số nút
                        </label>
                        <select className="product-form-filter-select" id="buttons" value={buttons} onChange={(e) => setButtons(e.target.value)}>
                          <option value="">Chọn số nút</option>
                          {BUTTONS_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {categoryFilter.driverSize && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="driver_size">
                          <i className="fas fa-compact-disc"></i> Kích thước driver
                        </label>
                        <select className="product-form-filter-select" id="driver_size" value={driverSize} onChange={(e) => setDriverSize(e.target.value)}>
                          <option value="">Chọn kích thước</option>
                          {DRIVER_SIZE_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {categoryFilter.frequency && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="frequency">
                          <i className="fas fa-wave-square"></i> Dải tần số
                        </label>
                        <input
                          className="product-form-filter-input"
                          id="frequency"
                          type="text"
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value)}
                          placeholder="VD: 20Hz - 20kHz"
                        />
                      </div>
                    )}

                    {categoryFilter.impedance && (
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="impedance">
                          <i className="fas fa-bolt"></i> Trở kháng
                        </label>
                        <input
                          className="product-form-filter-input"
                          id="impedance"
                          type="text"
                          value={impedance}
                          onChange={(e) => setImpedance(e.target.value)}
                          placeholder="VD: 32Ω"
                        />
                      </div>
                    )}
                  </div>

                  {categoryFilter.connection && (
                    <div className="product-form-filter-row">
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="connection_types">
                          <i className="fas fa-plug"></i> Loại kết nối
                        </label>
                        <select
                          className="product-form-filter-select-multiple"
                          id="connection_types"
                          multiple
                          value={connectionTypes}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setConnectionTypes(selected);
                          }}
                          size={5}
                        >
                          {CONNECTION_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <small className="product-form-filter-hint">Giữ Ctrl (hoặc Cmd) để chọn nhiều</small>
                      </div>
                    </div>
                  )}

                  {categoryFilter.compatibility && (
                    <div className="product-form-filter-row">
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="compatibility">
                          <i className="fas fa-check-double"></i> Tương thích
                        </label>
                        <select
                          className="product-form-filter-select-multiple"
                          id="compatibility"
                          multiple
                          value={compatibility}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setCompatibility(selected);
                          }}
                          size={5}
                        >
                          {COMPATIBILITY_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <small className="product-form-filter-hint">Giữ Ctrl (hoặc Cmd) để chọn nhiều</small>
                      </div>
                    </div>
                  )}

                  {categoryFilter.led && (
                    <div className="product-form-filter-row">
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="led_type">
                          <i className="fas fa-lightbulb"></i> Loại đèn LED
                        </label>
                        <select className="product-form-filter-select" id="led_type" value={ledType} onChange={(e) => setLedType(e.target.value)}>
                          <option value="">Chọn loại LED</option>
                          {LED_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {categoryFilter.features && (
                    <div className="product-form-filter-row">
                      <div className="product-form-filter-field">
                        <label className="product-form-filter-label" htmlFor="product_features">
                          <i className="fas fa-star"></i> Tiện ích
                        </label>
                        <select
                          className="product-form-filter-select-multiple"
                          id="product_features"
                          multiple
                          value={productFeatures}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setProductFeatures(selected);
                          }}
                          size={5}
                        >
                          {FEATURES_OPTIONS.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                        <small className="product-form-filter-hint">Giữ Ctrl (hoặc Cmd) để chọn nhiều</small>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
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

            {/* ẩn digital */}
            {/*
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
            */}
            
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

      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="notification-modal-overlay" onClick={() => setErrorModal({isOpen: false, title: '', message: ''})}>
          <div className="notification-modal error" onClick={(e) => e.stopPropagation()}>
            <div className="notification-modal-header">
              <i className="fas fa-exclamation-circle"></i>
              <h3>{errorModal.title}</h3>
            </div>
            <div className="notification-modal-body">
              <p>{errorModal.message}</p>
            </div>
            <div className="notification-modal-footer">
              <button 
                className="btn-primary" 
                onClick={() => setErrorModal({isOpen: false, title: '', message: ''})}
              >
                <i className="fas fa-check"></i> Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductFormModal;
