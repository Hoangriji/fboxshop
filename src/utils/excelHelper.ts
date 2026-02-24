import * as XLSX from 'xlsx';
import type { Product } from '../types';

/**
 * Column mapping: Vietnamese/English → Product field
 */
const COLUMN_MAPPING: Record<string, keyof Product | string> = {
  // Required fields
  'tên sản phẩm': 'name',
  'name': 'name',
  'product name': 'name',
  
  'giá bán (vnd)': 'price_vnd',
  'giá bán': 'price_vnd',
  'price_vnd': 'price_vnd',
  'price': 'price_vnd',
  
  'giá ảo (vnd)': 'price_virtual',
  'giá ảo': 'price_virtual',
  'price_virtual': 'price_virtual',
  'virtual price': 'price_virtual',
  
  // Optional fields
  'mô tả': 'description',
  'description': 'description',
  
  'danh mục': 'category',
  'category': 'category',
  
  'danh mục con': 'subcategory',
  'subcategory': 'subcategory',
  
  'sku': 'sku',
  
  'tồn kho': 'stock',
  'stock': 'stock',
  'quantity': 'stock',
  
  'hình ảnh': 'images',
  'images': 'images',
  'image urls': 'images',
  
  'loại': 'type',
  'type': 'type',
  
  'nổi bật': 'featured',
  'featured': 'featured',
  
  'thẻ tag': 'tags',
  'tags': 'tags',
  
  'giá gốc (vnd)': 'original_price_vnd',
  'giá gốc': 'original_price_vnd',
  'original_price_vnd': 'original_price_vnd',
  
  'thương hiệu': 'brand',
  'brand': 'brand',
  
  // New fields
  'tính năng': 'features',
  'features': 'features',
  
  'thông số kỹ thuật': 'specs',
  'specs': 'specs',
  'specifications': 'specs',
  
  'file số': 'digital_file',
  'digital_file': 'digital_file',
  'digital file': 'digital_file',
  
  'kích thước file': 'file_size',
  'file_size': 'file_size',
  'file size': 'file_size',
};

/**
 * Category mapping: Vietnamese → English
 */
const CATEGORY_MAPPING: Record<string, string> = {
  'bàn phím': 'keyboard',
  'chuột': 'mouse',
  'tai nghe': 'headset',
  'màn hình': 'monitor',
  'usb/thẻ nhớ': 'usb-storage',
  'sản phẩm số': 'digital-products',
  'khác': 'other',
};

export interface ParsedProduct extends Partial<Product> {
  stock?: number; // Inventory quantity (separate from stock_status)
  _row?: number;
  _errors?: string[];
  _warnings?: string[];
}

/**
 * Parse Excel file and convert to Product objects
 */
export const parseExcelFile = async (file: File): Promise<ParsedProduct[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet);
        
        // Map to Product objects
        const products = rawData.map((row, index) => 
          mapRowToProduct(row, index + 2) // +2 because Excel rows start at 1, and row 1 is header
        );
        
        resolve(products);
      } catch (error) {
        reject(new Error(`Lỗi khi đọc file Excel: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file'));
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * Map a single Excel row to Product object
 */
const mapRowToProduct = (row: Record<string, unknown>, rowNumber: number): ParsedProduct => {
  const product: ParsedProduct = {
    _row: rowNumber,
    _errors: [],
    _warnings: [],
  };

  // Normalize column names (lowercase, trim)
  const normalizedRow: Record<string, unknown> = {};
  Object.keys(row).forEach(key => {
    const normalizedKey = key.toLowerCase().trim();
    normalizedRow[normalizedKey] = row[key];
  });

  // Map columns to product fields
  Object.keys(normalizedRow).forEach(columnName => {
    const fieldName = COLUMN_MAPPING[columnName];
    if (!fieldName) {
      return; // Skip unknown columns
    }

    let value = normalizedRow[columnName];

    // Type conversions
    switch (fieldName) {
      case 'price_vnd':
      case 'price_virtual':
      case 'original_price_vnd':
      case 'stock':
        value = parseNumber(value);
        break;
      
      case 'images':
      case 'tags':
        value = parseArray(value);
        break;
      
      case 'features':
        // Features: semicolon-separated list
        value = parseArray(value, ';');
        break;
      
      case 'specs':
        // Specs: "Key1:Value1;Key2:Value2" → {Key1: Value1, Key2: Value2}
        value = parseSpecs(value);
        break;
      
      case 'featured':
        value = parseBoolean(value);
        break;
      
      case 'type':
        value = value === 'digital' || value === 'số' ? 'digital' : 'physical';
        break;
      
      case 'category':
        value = mapCategory(value);
        break;
    }

    // @ts-expect-error - Dynamic field assignment
    product[fieldName] = value;
  });

  // Set defaults
  if (!product.type) {
    product.type = 'physical';
  }
  
  if (product.featured === undefined) {
    product.featured = false;
  }

  // Auto-set price_virtual if not provided
  if (!product.price_virtual && product.price_vnd) {
    product.price_virtual = product.price_vnd;
  }

  if (!product.images || product.images.length === 0) {
    product.images = ['/assets/images/placeholder-product.jpg'];
    if (!product._warnings) product._warnings = [];
    product._warnings.push('Không có hình ảnh, sử dụng placeholder');
  }

  if (!product.description) {
    product.description = '';
  }

  if (!product.tags) {
    product.tags = [];
  }

  // Set stock status based on stock
  if (product.stock !== undefined) {
    if (product.stock === 0) {
      product.stock_status = 'out_of_stock';
    } else {
      product.stock_status = 'in_stock';
    }
  }

  // Default category if not provided
  if (!product.category) {
    product.category = 'other';
    if (!product._warnings) product._warnings = [];
    product._warnings.push('Không có danh mục, đặt mặc định là "Khác"');
  }

  // Default subcategory
  if (!product.subcategory) {
    product.subcategory = 'general';
  }

  return product;
};

/**
 * Parse number from various formats
 */
const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove commas, spaces, currency symbols
    const cleaned = value.replace(/[,\s₫VND]/gi, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  return 0;
};

/**
 * Parse array from comma-separated string
 */
const parseArray = (value: unknown, separator: string = ','): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.split(separator).map(item => item.trim()).filter(Boolean);
  }
  
  return [];
};

/**
 * Parse specs from "Key1:Value1;Key2:Value2" format
 */
const parseSpecs = (value: unknown): Record<string, string> | undefined => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  
  if (typeof value === 'string' && value.trim()) {
    const specs: Record<string, string> = {};
    const pairs = value.split(';').map(item => item.trim()).filter(Boolean);
    
    pairs.forEach(pair => {
      const [key, val] = pair.split(':').map(s => s.trim());
      if (key && val) {
        specs[key] = val;
      }
    });
    
    return Object.keys(specs).length > 0 ? specs : undefined;
  }
  
  return undefined;
};

/**
 * Parse boolean from various formats
 */
const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === 'có' || lower === '1';
  }
  
  if (typeof value === 'number') {
    return value === 1;
  }
  
  return false;
};

/**
 * Map Vietnamese category to English
 */
const mapCategory = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'other';
  }
  
  const normalized = value.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] || value;
};

/**
 * Generate Excel template for download
 */
export const generateExcelTemplate = (): void => {
  const templateData = [
    {
      // Required fields
      'Tên sản phẩm': 'Akko 3084B Plus',
      'Loại': 'physical',
      'Danh mục': 'keyboard',
      'Mô tả': 'Bàn phím cơ Akko 3084B Plus với switch Gateron Yellow. Thiết kế TKL (80%), switch hot-swap, LED RGB per-key.',
      'Giá bán (VND)': 1490000,
      
      // Optional pricing
      'Giá gốc (VND)': 1990000,
      
      // Product details
      'Danh mục con': 'mechanical',
      'SKU': 'AKKO-3084B-PLUS',
      'Thương hiệu': 'Akko',
      'Tồn kho': 50,
      
      // Media
      'Hình ảnh': 'https://example.com/akko-3084b-1.jpg,https://example.com/akko-3084b-2.jpg',
      
      // Features & Specs (semicolon-separated)
      'Tính năng': 'Hot-swappable switch;RGB per-key lighting;PBT keycaps;Anti-ghosting',
      'Thông số kỹ thuật': 'Switch:Gateron Yellow;Layout:TKL 84-key;Connection:USB-C;Cable:1.8m detachable',
      
      // Tags & Status
      'Thẻ tag': 'gaming,mechanical,akko,tkl,rgb',
      'Nổi bật': 'true',
      
      // For digital products (leave empty for physical)
      'File số': '',
      'Kích thước file': '',
    },
    {
      // Required fields
      'Tên sản phẩm': 'Logitech G Pro X Wireless',
      'Loại': 'physical',
      'Danh mục': 'mouse',
      'Mô tả': 'Chuột gaming không dây Logitech G Pro X với cảm biến HERO 25K. Pin 60 giờ, trọng lượng siêu nhẹ 63g.',
      'Giá bán (VND)': 2990000,
      
      // Optional pricing
      'Giá gốc (VND)': 3490000,
      
      // Product details
      'Danh mục con': 'gaming',
      'SKU': 'LOGI-GPRO-X-WIRELESS',
      'Thương hiệu': 'Logitech',
      'Tồn kho': 30,
      
      // Media
      'Hình ảnh': 'https://example.com/logitech-gpro-x.jpg',
      
      // Features & Specs (semicolon-separated)
      'Tính năng': 'Wireless 2.4GHz;HERO 25K sensor;60-hour battery;Lightsync RGB',
      'Thông số kỹ thuật': 'DPI:100-25600;Sensor:HERO 25K;Buttons:8 programmable;Weight:63g',
      
      // Tags & Status
      'Thẻ tag': 'gaming,wireless,logitech,lightweight',
      'Nổi bật': 'false',
      
      // For digital products
      'File số': '',
      'Kích thước file': '',
    },
    {
      // Example Digital Product
      'Tên sản phẩm': 'Preset Lightroom Mobile - Vintage Film',
      'Loại': 'digital',
      'Danh mục': 'digital-products',
      'Mô tả': 'Bộ 50+ preset Lightroom Mobile phong cách Vintage Film, tông màu ấm, hạt phim mịn.',
      'Giá bán (VND)': 0,
      
      // Optional pricing
      'Giá gốc (VND)': 199000,
      
      // Product details
      'Danh mục con': 'presets',
      'SKU': 'PRESET-LR-VINTAGE-50',
      'Thương hiệu': '',
      'Tồn kho': 999,
      
      // Media
      'Hình ảnh': 'https://example.com/preset-vintage.jpg',
      
      // Features & Specs
      'Tính năng': 'One-tap apply;Mobile & Desktop compatible;Non-destructive;Layered editing',
      'Thông số kỹ thuật': 'Format:DNG & XMP;Compatibility:Lightroom Mobile & CC;Quantity:50+ presets;Size:15MB',
      
      // Tags & Status
      'Thẻ tag': 'lightroom,preset,vintage,film,photography',
      'Nổi bật': 'true',
      
      // For digital products
      'File số': 'https://drive.google.com/preset-vintage-film.zip',
      'Kích thước file': '15MB',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

  // Set column widths
  const colWidths = [
    { wch: 30 }, // Tên sản phẩm
    { wch: 10 }, // Loại
    { wch: 18 }, // Danh mục
    { wch: 60 }, // Mô tả
    { wch: 15 }, // Giá bán
    { wch: 15 }, // Giá gốc
    { wch: 18 }, // Danh mục con
    { wch: 25 }, // SKU
    { wch: 15 }, // Thương hiệu
    { wch: 10 }, // Tồn kho
    { wch: 60 }, // Hình ảnh
    { wch: 60 }, // Tính năng
    { wch: 60 }, // Thông số kỹ thuật
    { wch: 40 }, // Thẻ tag
    { wch: 10 }, // Nổi bật
    { wch: 50 }, // File số
    { wch: 15 }, // Kích thước file
  ];
  worksheet['!cols'] = colWidths;

  // Download file
  XLSX.writeFile(workbook, 'product-import-template.xlsx');
};

/**
 * Export failed rows to Excel
 */
export const exportFailedRows = (failedProducts: ParsedProduct[]): void => {
  const exportData = failedProducts.map(product => {
    const row: Record<string, unknown> = {
      'Row': product._row,
      'Errors': product._errors?.join('; ') ?? '',
      'Tên sản phẩm': product.name || '',
      'Giá gốc (VND)': product.original_price_vnd || '',
      'Giá bán (VND)': product.price_vnd || '',
      'Danh mục': product.category || '',
      'SKU': product.sku || '',
      'Tồn kho': product.stock || '',
    };
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Rows');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(workbook, `failed-imports-${timestamp}.xlsx`);
};
