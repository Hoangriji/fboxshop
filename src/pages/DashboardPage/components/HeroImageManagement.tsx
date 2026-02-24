import React, { useState } from 'react';
import { useSiteConfig } from '../../../hooks/useSiteConfig';
import { CloudinaryService } from '../../../services/cloudinaryService';
import { SiteConfigService } from '../../../services/firebaseService';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import './HeroImageManagement.css';

// Helper to clear hero image cache
const clearHeroImageCache = async (): Promise<void> => {
  try {
    // Clear localStorage
    localStorage.removeItem('hero_image_cache');
    localStorage.removeItem('hero_image_version');

    // Clear Cache API
    if ('caches' in window) {
      await caches.delete('hero-images-v1');
    }
  } catch (error) {
    console.error('Error clearing hero image cache:', error);
  }
};

const HeroImageManagement: React.FC = () => {
  const { config, loading } = useSiteConfig();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentHeroImage = config?.site?.hero_image_url;
  const currentPublicId = config?.site?.hero_image_public_id;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    // Validate file
    const validation = CloudinaryService.validateImage(file, 5);
    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file ảnh');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(30);
      setError(null);
      setSuccess(null);

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadImage(
        selectedFile,
        'hero-images'
      );

      setUploadProgress(70);

      // Delete old image if exists
      if (currentPublicId) {
        try {
          await CloudinaryService.deleteImage(currentPublicId);
        } catch (err) {
          console.warn('Failed to delete old hero image:', err);
          // Don't fail the upload if deletion fails
        }
      }

      setUploadProgress(90);

      // Update site config with new hero image
      await SiteConfigService.updateSiteConfig({
        site: {
          ...config?.site,
          hero_image_url: uploadResult.url,
          hero_image_public_id: uploadResult.publicId,
        },
      });

      // Clear cache so new image loads immediately
      await clearHeroImageCache();

      setUploadProgress(100);
      setSuccess('Cập nhật hình nền Hero Section thành công! Cache đã được xóa.');
      setSelectedFile(null);
      setPreviewUrl(null);

      // Reset after 3 seconds
      setTimeout(() => {
        setUploadProgress(0);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(
        err instanceof Error ? err.message : 'Lỗi khi upload ảnh'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveHeroImage = async () => {
    try {
      setUploading(true);
      setError(null);

      // Delete from Cloudinary if exists
      if (currentPublicId) {
        try {
          await CloudinaryService.deleteImage(currentPublicId);
        } catch (err) {
          console.warn('Failed to delete from Cloudinary:', err);
        }
      }

      // Remove from config — use null (not undefined) since Firestore rejects undefined
      await SiteConfigService.updateSiteConfig({
        site: {
          ...config?.site,
          hero_image_url: null,
          hero_image_public_id: null,
        },
      });

      // Clear cache
      await clearHeroImageCache();

      setSuccess('Đã xóa hình nền Hero Section thành công! Cache đã được xóa.');

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Remove error:', err);
      setError(
        err instanceof Error ? err.message : 'Lỗi khi xóa ảnh'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCancelPreview = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="hero-image-management">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="hero-image-management">
      <div className="page-header">
        <h2>
          <i className="fas fa-image"></i> Quản lý Hình nền
        </h2>
        <p className="page-description">
          Upload và quản lý hình nền cho Hero Section trên trang chủ. Ảnh sẽ được lưu trữ trên Cloudinary.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      <div className="hero-image-content">
        {/* Current Hero Image */}
        <div className="current-image-section">
          <h3 className="section-title">
            <i className="fas fa-photo-video"></i> Hình nền hiện tại
          </h3>
          <div className="image-preview-large">
            {currentHeroImage ? (
              <>
                <img src={currentHeroImage} alt="Current Hero" />
                <div className="image-info">
                  <span className="image-status">
                    <i className="fas fa-cloud"></i> Cloudinary
                  </span>
                  <button
                    className="btn-remove"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={uploading}
                  >
                    <i className="fas fa-trash"></i> Xóa và dùng ảnh mặc định
                  </button>
                </div>
              </>
            ) : (
              <div className="no-image">
                <i className="fas fa-image"></i>
                <p>Đang sử dụng ảnh mặc định từ assets</p>
                <small>Upload ảnh mới để thay thế</small>
              </div>
            )}
          </div>
        </div>

        {/* Upload New Image */}
        <div className="upload-section">
          <h3 className="section-title">
            <i className="fas fa-upload"></i> Upload hình nền mới
          </h3>

          <div className="upload-area">
            {!previewUrl ? (
              <label className="file-drop-zone">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <div className="drop-zone-content">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Kéo thả ảnh vào đây hoặc nhấp để chọn</p>
                  <small>Chấp nhận JPG, PNG, WebP - Tối đa 5MB</small>
                  <small>Khuyến nghị: 1920x1080px hoặc lớn hơn</small>
                </div>
              </label>
            ) : (
              <div className="preview-section">
                <div className="preview-image">
                  <img src={previewUrl} alt="Preview" />
                  <div className="preview-overlay">
                    <button
                      className="btn-icon"
                      onClick={handleCancelPreview}
                      disabled={uploading}
                      title="Hủy"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                </div>
                <div className="preview-details">
                  <h4>
                    <i className="fas fa-file-image"></i> {selectedFile?.name}
                  </h4>
                  <p className="file-size">
                    {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    className="btn-upload btn-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Đang upload...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt"></i> Upload và cập nhật
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {uploading && uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="upload-instructions">
            <h4><i className="fas fa-info-circle"></i> Hướng dẫn:</h4>
            <ul>
              <li>Chọn ảnh có độ phân giải cao (khuyến nghị 1920x1080px trở lên)</li>
              <li>Ảnh sẽ được upload lên Cloudinary và tự động tối ưu hóa</li>
              <li>Khi upload ảnh mới, ảnh cũ trên Cloudinary sẽ tự động bị xóa</li>
              <li>Thay đổi sẽ hiển thị ngay lập tức trên trang chủ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Xóa hình nền Hero Section"
        message="Bạn có chắc muốn xóa hình nền hiện tại? Trang chủ sẽ quay về ảnh mặc định."
        icon="warning"
        primaryButtonLabel="Xóa"
        secondaryButtonLabel="Hủy"
        onPrimaryAction={() => {
          setShowDeleteModal(false);
          handleRemoveHeroImage();
        }}
        onClose={() => setShowDeleteModal(false)}
      />
    </>
  );
};

export default HeroImageManagement;
