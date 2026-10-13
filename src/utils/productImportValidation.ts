import type { ParsedProduct } from './excelHelper';
import type { Product } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a single parsed product
 */
export const validateProduct = (product: ParsedProduct): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!product.name || product.name.trim() === '') {
    errors.push('Tên sản phẩm là bắt buộc');
  } else if (product.name.length < 3) {
    errors.push('Tên sản phẩm phải có ít nhất 3 ký tự');
  } else if (product.name.length > 200) {
    errors.push('Tên sản phẩm không được quá 200 ký tự');
  }

  if (product.price_vnd === undefined || product.price_vnd === null) {
    errors.push('Giá bán là bắt buộc');
  } else if (product.price_vnd < 0) {
    errors.push('Giá bán không được âm');
  } else if (product.price_vnd === 0) {
    warnings.push('Giá bán = 0, có thể là sản phẩm miễn phí');
  }

  // price_virtual is auto-set if not provided, so only validate if exists
  if (product.price_virtual !== undefined && product.price_virtual !== null) {
    if (product.price_virtual < 0) {
      errors.push('Giá ảo không được âm');
    } else if (product.price_vnd && product.price_virtual < product.price_vnd) {
      warnings.push('Giá ảo nhỏ hơn giá bán, discount sẽ âm');
    }
  }

  // Category validation
  const validCategories = [
    'keyboard',
    'mouse',
    'headset',
    'monitor',
    'usb',
    'usb-storage',
    'digital',
    'digital-products',
    'other'
  ];
  
  if (product.category && !validCategories.includes(product.category)) {
    warnings.push(`Danh mục "${product.category}" không hợp lệ, nên dùng: ${validCategories.join(', ')}`);
  }

  // Type validation
  if (product.type && !['physical', 'digital'].includes(product.type)) {
    errors.push('Loại sản phẩm phải là "physical" hoặc "digital"');
  }

  // SKU validation
  if (product.sku) {
    if (product.sku.length < 3) {
      warnings.push('SKU quá ngắn, nên có ít nhất 3 ký tự');
    }
    if (!/^[A-Z0-9\-_]+$/i.test(product.sku)) {
      warnings.push('SKU chỉ nên chứa chữ, số, dấu gạch ngang và gạch dưới');
    }
  }

  // Stock validation
  if (product.stock !== undefined) {
    if (product.stock < 0) {
      errors.push('Tồn kho không được âm');
    }
    if (product.stock === 0) {
      warnings.push('Tồn kho = 0, sản phẩm sẽ ở trạng thái hết hàng');
    }
  }

  // Images validation
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((url, index) => {
      if (!isValidUrl(url) && !url.startsWith('/assets/')) {
        warnings.push(`Hình ảnh ${index + 1} có URL không hợp lệ: ${url}`);
      }
    });
  }

  // Description validation
  if (product.description && product.description.length > 5000) {
    warnings.push('Mô tả quá dài (> 5000 ký tự)');
  }

  // Price logic validation
  if (product.original_price_vnd && product.price_vnd && product.original_price_vnd > 0) {
    if (product.original_price_vnd < product.price_vnd) {
      warnings.push('Giá gốc nhỏ hơn giá bán, không hợp lý');
    }
  }

  // Digital product validation
  if (product.type === 'digital') {
    if (product.stock !== undefined && product.stock !== 1000) {
      warnings.push('Sản phẩm số thường có stock = 1000 (unlimited)');
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
  };
};

/**
 * Validate all products and update their error/warning arrays
 */
export const validateProducts = (products: ParsedProduct[]): ParsedProduct[] => {
  return products.map(product => {
    const result = validateProduct(product);
    return {
      ...product,
      _errors: [...(product._errors || []), ...result.errors],
      _warnings: [...(product._warnings || []), ...result.warnings],
    };
  });
};

/**
 * Check for duplicate SKUs within the import batch
 */
export const checkDuplicateSKUs = (products: ParsedProduct[]): ParsedProduct[] => {
  const skuMap = new Map<string, number[]>();

  // Build SKU map (SKU -> row numbers)
  products.forEach((product, index) => {
    if (product.sku) {
      const sku = product.sku.toUpperCase();
      if (!skuMap.has(sku)) {
        skuMap.set(sku, []);
      }
      skuMap.get(sku)!.push(index);
    }
  });

  // Mark duplicates
  const updatedProducts = [...products];
  skuMap.forEach((indices, sku) => {
    if (indices.length > 1) {
      indices.forEach(idx => {
        if (!updatedProducts[idx]._errors) updatedProducts[idx]._errors = [];
        updatedProducts[idx]._errors!.push(
          `SKU "${sku}" bị trùng lặp ở các dòng: ${indices.map(i => products[i]._row).join(', ')}`
        );
      });
    }
  });

  return updatedProducts;
};

/**
 * Filter valid products (no errors)
 */
export const getValidProducts = (products: ParsedProduct[]): ParsedProduct[] => {
  return products.filter(p => (p._errors?.length ?? 0) === 0);
};

/**
 * Filter invalid products (has errors)
 */
export const getInvalidProducts = (products: ParsedProduct[]): ParsedProduct[] => {
  return products.filter(p => (p._errors?.length ?? 0) > 0);
};

/**
 * Convert ParsedProduct to clean Product (remove validation fields)
 */
export const toCleanProduct = (product: ParsedProduct): Omit<Product, 'id'> => {
  const clean: Partial<Product> = { ...product };
  
  // Remove validation fields
  delete (clean as ParsedProduct)._row;
  delete (clean as ParsedProduct)._errors;
  delete (clean as ParsedProduct)._warnings;

  // Ensure stock_status
  if (!clean.stock_status) {
    clean.stock_status = (product.stock !== undefined && product.stock === 0) ? 'out_of_stock' : 'in_stock';
  }

  // Remove temporary Excel-only stock field from Firestore Product
  delete (clean as ParsedProduct).stock;

  // Normalize category to standard Firestore IDs
  if (clean.category === 'usb-storage') {
    clean.category = 'usb';
  } else if (clean.category === 'digital-products') {
    clean.category = 'digital';
  }

  // Ensure original_price_vnd defaults to price_vnd if missing, null, or <= 0
  const curPrice = typeof clean.price_vnd === 'number' ? clean.price_vnd : Number(clean.price_vnd) || 0;
  if (!clean.original_price_vnd || clean.original_price_vnd <= 0) {
    clean.original_price_vnd = curPrice;
  }
  clean.price_virtual = clean.original_price_vnd;
  if (clean.original_price_vnd > curPrice) {
    clean.discount = Math.round(((clean.original_price_vnd - curPrice) / clean.original_price_vnd) * 100);
  } else {
    clean.discount = 0;
  }

  // Ensure source tracking for manual/excel import
  if (!clean.source) {
    clean.source = 'manual';
  }

  // Ensure timestamps
  if (!clean.created_at) {
    clean.created_at = new Date().toISOString();
  }

  return clean as Omit<Product, 'id'>;
};

/**
 * Validate URL format
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get validation summary statistics
 */
export const getValidationSummary = (products: ParsedProduct[]) => {
  const total = products.length;
  const valid = products.filter(p => (p._errors?.length ?? 0) === 0).length;
  const invalid = total - valid;
  const withWarnings = products.filter(p => (p._warnings?.length ?? 0) > 0).length;

  return {
    total,
    valid,
    invalid,
    withWarnings,
    validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
  };
};
