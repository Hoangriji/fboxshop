import { cloudinaryConfig } from '../config/cloudinary';

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export class CloudinaryService {
  /**
   * Upload image to Cloudinary using unsigned upload
   * @param file - Image file to upload
   * @param folder - Folder name in Cloudinary (default: 'hero-images')
   * @returns Upload response with URL and public_id
   */
  static async uploadImage(
    file: File,
    folder: string = 'hero-images'
  ): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', folder);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
      }

      const data = await response.json();

      return {
        url: data.secure_url,
        publicId: data.public_id,
        width: data.width,
        height: data.height,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    }
  }

  /**
   * Delete image from Cloudinary
   * Note: This requires backend API with Cloudinary signed request
   * For frontend-only, we can't delete directly due to security
   * @param publicId - Cloudinary public_id of the image
   */
  static async deleteImage(publicId: string): Promise<void> {
    // Deleting from frontend directly is not supported (requires API secret).
    // Implement a backend endpoint to handle Cloudinary deletion.
    console.warn('Cloudinary deleteImage requires a backend endpoint:', publicId);
    return Promise.resolve();
  }

  /**
   * Get optimized image URL with transformations
   * @param publicId - Cloudinary public_id
   * @param width - Desired width
   * @param height - Desired height (optional)
   * @param quality - Image quality (default: auto)
   * @returns Optimized image URL
   */
  static getOptimizedUrl(
    publicId: string,
    width: number,
    height?: number,
    quality: string = 'auto'
  ): string {
    const transformations = [
      `w_${width}`,
      height ? `h_${height}` : null,
      `q_${quality}`,
      'f_auto',
      'c_fill',
    ]
      .filter(Boolean)
      .join(',');

    return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${transformations}/${publicId}`;
  }

  /**
   * Validate image file
   * @param file - File to validate
   * @param maxSizeMB - Maximum file size in MB (default: 5MB)
   * @returns Validation result
   */
  static validateImage(
    file: File,
    maxSizeMB: number = 5
  ): { valid: boolean; error?: string } {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP',
      };
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Kích thước file không được vượt quá ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }
}
