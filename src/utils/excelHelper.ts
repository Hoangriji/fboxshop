import * as XLSX from 'xlsx';
import type { Product } from '../types';

/**
 * Column mapping: Vietnamese/English/Aliases → Product field
 */
const COLUMN_MAPPING: Record<string, keyof Product | string> = {
  // Required fields
  'tên sản phẩm': 'name',
  'name': 'name',
  'product name': 'name',
  'tên': 'name',
  'ten san pham': 'name',
  
  'giá bán (vnd)': 'price_vnd',
  'giá bán': 'price_vnd',
  'price_vnd': 'price_vnd',
  'price': 'price_vnd',
  'gia ban': 'price_vnd',
  'giá': 'price_vnd',
  'gia': 'price_vnd',
  
  'giá gốc (vnd)': 'original_price_vnd',
  'giá gốc': 'original_price_vnd',
  'original_price_vnd': 'original_price_vnd',
  'original price': 'original_price_vnd',
  'gia goc': 'original_price_vnd',

  'giá ảo (vnd)': 'price_virtual',
  'giá ảo': 'price_virtual',
  'price_virtual': 'price_virtual',
  'virtual price': 'price_virtual',
  'gia ao': 'price_virtual',
  
  // Basic info
  'mô tả': 'description',
  'description': 'description',
  'mo ta': 'description',
  'chi tiết': 'description',
  
  'danh mục': 'category',
  'category': 'category',
  'danh muc': 'category',
  
  'danh mục con': 'subcategory',
  'subcategory': 'subcategory',
  'danh muc con': 'subcategory',
  'phân loại': 'subcategory',
  
  'thương hiệu': 'brand',
  'brand': 'brand',
  'thuong hieu': 'brand',
  'hãng': 'brand',
  'hang': 'brand',
  
  'sku': 'sku',
  'mã sản phẩm': 'sku',
  'mã sp': 'sku',
  'ma san pham': 'sku',
  'ma sp': 'sku',
  
  'tồn kho': 'stock',
  'stock': 'stock',
  'quantity': 'stock',
  'số lượng': 'stock',
  'so luong': 'stock',
  'ton kho': 'stock',
  
  'trạng thái kho': 'stock_status',
  'trạng thái': 'stock_status',
  'stock_status': 'stock_status',
  'stock status': 'stock_status',
  'tình trạng': 'stock_status',
  
  'hình ảnh': 'images',
  'images': 'images',
  'image urls': 'images',
  'image': 'images',
  'ảnh': 'images',
  'hinh anh': 'images',
  'link ảnh': 'images',
  
  'loại': 'type',
  'type': 'type',
  'loai san pham': 'type',
  'loại sản phẩm': 'type',
  
  'nổi bật': 'featured',
  'featured': 'featured',
  'noi bat': 'featured',
  
  'thẻ tag': 'tags',
  'tags': 'tags',
  'tag': 'tags',
  'the tag': 'tags',
  'từ khóa': 'tags',
  
  'tính năng': 'features',
  'features': 'features',
  'tinh nang': 'features',
  'đặc điểm nổi bật': 'features',
  
  'thông số kỹ thuật': 'specs',
  'specs': 'specs',
  'specifications': 'specs',
  'thong so ky thuat': 'specs',
  'thông số': 'specs',
  'cấu hình': 'specs',

  // Common filter: Connection & Compatibility
  'cổng kết nối': 'connection_types',
  'connection_types': 'connection_types',
  'connection types': 'connection_types',
  'kết nối': 'connection_types',
  'kiểu kết nối': 'connection_types',
  'cong ket noi': 'connection_types',
  'ket noi': 'connection_types',

  'tương thích': 'compatibility',
  'compatibility': 'compatibility',
  'tuong thich': 'compatibility',
  'hệ điều hành': 'compatibility',
  'hệ điều hành tương thích': 'compatibility',

  'đèn led': 'led_type',
  'led': 'led_type',
  'led_type': 'led_type',
  'loại led': 'led_type',
  'den led': 'led_type',

  'tiện ích': 'features_detailed',
  'tiện ích chi tiết': 'features_detailed',
  'features_detailed': 'features_detailed',
  'tính năng chi tiết': 'features_detailed',

  // Keyboard specific
  'loại bàn phím': 'form_factor',
  'form factor': 'form_factor',
  'form_factor': 'form_factor',
  'layout': 'form_factor',
  'kích thước bàn phím': 'form_factor',
  'loai ban phim': 'form_factor',

  // Monitor specific
  'kích thước màn hình': 'screen_size',
  'kích thước': 'screen_size',
  'screen_size': 'screen_size',
  'screen size': 'screen_size',
  'kich thuoc man hinh': 'screen_size',
  'kich thuoc': 'screen_size',

  'độ phân giải': 'resolution',
  'resolution': 'resolution',
  'do phan giai': 'resolution',

  'tần số quét': 'refresh_rate',
  'refresh_rate': 'refresh_rate',
  'refresh rate': 'refresh_rate',
  'tan so quet': 'refresh_rate',

  'tấm nền': 'panel_type',
  'loại tấm nền': 'panel_type',
  'panel_type': 'panel_type',
  'panel type': 'panel_type',
  'tam nen': 'panel_type',

  'thời gian phản hồi': 'response_time',
  'response_time': 'response_time',
  'response time': 'response_time',
  'thoi gian phan hoi': 'response_time',

  'ngàm vesa': 'vesa_mount',
  'vesa_mount': 'vesa_mount',
  'vesa mount': 'vesa_mount',
  'vesa': 'vesa_mount',

  'tính năng màn hình': 'monitor_features',
  'monitor_features': 'monitor_features',
  'monitor features': 'monitor_features',

  // Headset specific
  'loại tai nghe': 'headset_type',
  'kiểu tai nghe': 'headset_type',
  'headset_type': 'headset_type',
  'headset type': 'headset_type',
  'loai tai nghe': 'headset_type',

  'nhu cầu sử dụng': 'use_cases',
  'nhu cầu': 'use_cases',
  'mục đích sử dụng': 'use_cases',
  'use_cases': 'use_cases',
  'use cases': 'use_cases',

  // Mouse specific
  'dpi': 'dpi',
  'độ phân giải dpi': 'dpi',
  'cảm biến': 'sensor',
  'loại cảm biến': 'sensor',
  'sensor': 'sensor',
  'trọng lượng': 'mouse_weight',
  'trọng lượng chuột': 'mouse_weight',

  // USB & Storage specific
  'dung lượng': 'storage_capacity',
  'dung lượng lưu trữ': 'storage_capacity',
  'storage_capacity': 'storage_capacity',
  'storage capacity': 'storage_capacity',
  'bộ nhớ': 'storage_capacity',
  'dung luong': 'storage_capacity',

  'loại usb': 'usb_type',
  'chuẩn usb': 'usb_type',
  'usb_type': 'usb_type',
  'usb type': 'usb_type',
  'loai usb': 'usb_type',

  'tốc độ đọc': 'read_speed',
  'read_speed': 'read_speed',
  'read speed': 'read_speed',
  'toc do doc': 'read_speed',

  'tốc độ ghi': 'write_speed',
  'write_speed': 'write_speed',
  'write speed': 'write_speed',
  'toc do ghi': 'write_speed',

  'loại thẻ nhớ': 'memory_card_type',
  'memory_card_type': 'memory_card_type',
  'memory card type': 'memory_card_type',
  'thẻ nhớ': 'memory_card_type',

  // Other products specific
  'loại sản phẩm phụ': 'product_type',
  'phân loại sản phẩm': 'product_type',
  'product_type': 'product_type',
  'product type': 'product_type',

  'chất liệu': 'material',
  'vật liệu': 'material',
  'material': 'material',
  'chat lieu': 'material',

  'khoảng giá': 'price_range',
  'price_range': 'price_range',
  'price range': 'price_range',

  // Digital product fields
  'file số': 'digital_file',
  'digital_file': 'digital_file',
  'digital file': 'digital_file',
  'file so': 'digital_file',
  
  'kích thước file': 'file_size',
  'file_size': 'file_size',
  'file size': 'file_size',
  'dung lượng file': 'file_size',
};

/**
 * Category mapping: Vietnamese/Aliases → Firestore Category ID
 * Valid IDs: 'keyboard', 'monitor', 'headset', 'mouse', 'usb', 'other', 'digital'
 */
const CATEGORY_MAPPING: Record<string, string> = {
  'bàn phím': 'keyboard',
  'ban phim': 'keyboard',
  'keyboard': 'keyboard',
  'phím': 'keyboard',
  'phim co': 'keyboard',
  'bàn phím cơ': 'keyboard',
  
  'chuột': 'mouse',
  'chuot': 'mouse',
  'mouse': 'mouse',
  'chuột gaming': 'mouse',
  'chuot gaming': 'mouse',
  
  'tai nghe': 'headset',
  'tai nghe gaming': 'headset',
  'headset': 'headset',
  'headphone': 'headset',
  'tai phone': 'headset',
  'earphone': 'headset',
  
  'màn hình': 'monitor',
  'man hinh': 'monitor',
  'màn hình máy tính': 'monitor',
  'man hinh may tinh': 'monitor',
  'monitor': 'monitor',
  'man hinh do hoa': 'monitor',
  'màn hình đồ họa': 'monitor',
  
  'usb': 'usb',
  'usb/thẻ nhớ': 'usb',
  'usb & phụ kiện': 'usb',
  'usb va phu kien': 'usb',
  'thẻ nhớ': 'usb',
  'usb-storage': 'usb',
  'the nho': 'usb',
  'ổ cứng': 'usb',
  'o cung': 'usb',
  'phụ kiện': 'usb',
  'phu kien': 'usb',
  'accessories': 'usb',
  
  'sản phẩm khác': 'other',
  'san pham khac': 'other',
  'khác': 'other',
  'khac': 'other',
  'other': 'other',
  'lót chuột': 'other',
  'mousepad': 'other',
  'pad': 'other',
  'arm': 'other',

  'sản phẩm số': 'digital',
  'san pham so': 'digital',
  'tài liệu số': 'digital',
  'tai lieu so': 'digital',
  'digital': 'digital',
  'digital-products': 'digital',
};

export interface ParsedProduct extends Partial<Product> {
  stock?: number; // Inventory quantity
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
        
        // Find sheet: pick 'Products' if present, otherwise first sheet
        let targetSheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.includes('San_Pham_Mau')) {
          targetSheetName = 'San_Pham_Mau';
        } else if (workbook.SheetNames.includes('Products')) {
          targetSheetName = 'Products';
        } else if (workbook.SheetNames.includes('Sản phẩm')) {
          targetSheetName = 'Sản phẩm';
        } else if (workbook.SheetNames.includes('Danh_Sach_San_Pham')) {
          targetSheetName = 'Danh_Sach_San_Pham';
        }

        const worksheet = workbook.Sheets[targetSheetName];
        
        // Convert to JSON
        const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: true,
        });

        // Filter out empty rows
        const nonEmptyRows = rawData.filter(row => {
          return Object.values(row).some(val => val !== null && val !== undefined && String(val).trim() !== '');
        });
        
        // Map to Product objects
        const products = nonEmptyRows.map((row, index) => 
          mapRowToProduct(row, index + 2) // +2 because Excel rows start at 1, and row 1 is header
        );
        
        resolve(products);
      } catch (error) {
        reject(new Error(`Lỗi khi đọc file Excel: ${error instanceof Error ? error.message : error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file từ máy tính'));
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
    if (value === null || value === undefined) return;

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
        // Support comma, semicolon, newline separators
        value = parseArray(value, /[,\n\r;]+/);
        break;
      
      case 'features':
      case 'monitor_features':
        // Features: semicolon or newline separated list
        value = parseArray(value, /[;\n\r]+/);
        break;

      case 'connection_types':
      case 'compatibility':
        value = parseArray(value, /[,\n\r;]+/);
        break;

      case 'features_detailed':
      case 'use_cases':
        value = parseArray(value, /[;\n\r,]+/);
        break;
      
      case 'specs':
        // Specs: "Key1:Value1;Key2:Value2" or line breaks
        value = parseSpecs(value);
        break;
      
      case 'featured':
        value = parseBoolean(value);
        break;
      
      case 'type':
        value = (typeof value === 'string' && (value.toLowerCase().includes('digital') || value.toLowerCase().includes('số')))
          ? 'digital'
          : 'physical';
        break;
      
      case 'category':
        value = mapCategory(value);
        break;

      case 'stock_status':
        value = parseStockStatus(value);
        break;

      case 'name':
      case 'description':
      case 'subcategory':
      case 'sku':
      case 'brand':
      case 'digital_file':
      case 'file_size':
      case 'screen_size':
      case 'resolution':
      case 'refresh_rate':
      case 'panel_type':
      case 'response_time':
      case 'vesa_mount':
      case 'form_factor':
      case 'led_type':
      case 'headset_type':
      case 'storage_capacity':
      case 'usb_type':
      case 'read_speed':
      case 'write_speed':
      case 'memory_card_type':
      case 'product_type':
      case 'material':
      case 'price_range':
      case 'dpi':
      case 'sensor':
      case 'mouse_weight':
        value = typeof value === 'string' ? value.trim() : String(value).trim();
        break;
    }

    // @ts-expect-error - Dynamic field assignment
    product[fieldName] = value;
  });

  // Set defaults & cleanups
  if (!product.type) {
    product.type = 'physical';
  }
  
  if (product.featured === undefined) {
    product.featured = false;
  }

  // Expanded Brand Auto-detection from product name if empty
  if (!product.brand && product.name) {
    const lowerName = product.name.toLowerCase();
    if (lowerName.includes('asus') || lowerName.includes('rog') || lowerName.includes('proart') || lowerName.includes('tuf')) product.brand = 'ASUS';
    else if (lowerName.includes('logitech')) product.brand = 'Logitech';
    else if (lowerName.includes('razer')) product.brand = 'Razer';
    else if (lowerName.includes('corsair')) product.brand = 'Corsair';
    else if (lowerName.includes('steelseries')) product.brand = 'SteelSeries';
    else if (lowerName.includes('hyperx')) product.brand = 'HyperX';
    else if (lowerName.includes('akko')) product.brand = 'Akko';
    else if (lowerName.includes('keychron')) product.brand = 'Keychron';
    else if (lowerName.includes('dareu')) product.brand = 'Dareu';
    else if (lowerName.includes('dell') || lowerName.includes('ultrasharp')) product.brand = 'Dell';
    else if (lowerName.includes('lg') || lowerName.includes('ultrafine') || lowerName.includes('ultragear')) product.brand = 'LG';
    else if (lowerName.includes('samsung') || lowerName.includes('odyssey')) product.brand = 'Samsung';
    else if (lowerName.includes('sony')) product.brand = 'Sony';
    else if (lowerName.includes('sandisk')) product.brand = 'SanDisk';
    else if (lowerName.includes('kingston')) product.brand = 'Kingston';
    else if (lowerName.includes('ugreen')) product.brand = 'Ugreen';
    else if (lowerName.includes('baseus')) product.brand = 'Baseus';
    else if (lowerName.includes('pulsar')) product.brand = 'Pulsar';
    else if (lowerName.includes('lamzu')) product.brand = 'Lamzu';
    else if (lowerName.includes('filco')) product.brand = 'Filco';
    else if (lowerName.includes('leopold')) product.brand = 'Leopold';
    else if (lowerName.includes('viewsonic')) product.brand = 'ViewSonic';
    else if (lowerName.includes('msi')) product.brand = 'MSI';
    else if (lowerName.includes('acer') || lowerName.includes('predator')) product.brand = 'Acer';
  }

  // Auto-set subcategory if empty
  if (product.name && !product.subcategory) {
    const lowerName = product.name.toLowerCase();
    if (lowerName.includes('proart')) {
      product.subcategory = 'proart';
    } else if (lowerName.includes('tuf') || lowerName.includes('rog') || lowerName.includes('gaming')) {
      product.subcategory = 'gaming';
    } else if (lowerName.includes('wireless') || lowerName.includes('không dây')) {
      product.subcategory = 'wireless';
    } else {
      product.subcategory = 'general';
    }
  }

  // Ensure original_price_vnd defaults to price_vnd if missing, null, or <= 0
  const curPrice = typeof product.price_vnd === 'number' ? product.price_vnd : Number(product.price_vnd) || 0;
  if (!product.original_price_vnd || product.original_price_vnd <= 0) {
    product.original_price_vnd = curPrice;
  }

  // Auto-calculate discount and price_virtual
  if (product.original_price_vnd && curPrice && product.original_price_vnd > curPrice) {
    product.discount = Math.round(((product.original_price_vnd - curPrice) / product.original_price_vnd) * 100);
    product.price_virtual = product.original_price_vnd;
  } else {
    product.discount = 0;
    product.price_virtual = product.original_price_vnd || curPrice;
  }

  // Handle stock_status
  if (!product.stock_status) {
    if (product.stock !== undefined) {
      product.stock_status = product.stock === 0 ? 'out_of_stock' : 'in_stock';
    } else {
      product.stock_status = 'in_stock';
    }
  }

  // Fallback images
  if (!product.images || product.images.length === 0) {
    product.images = ['https://dlcdnwebimgs.asus.com/gain/proart-placeholder.jpg'];
    if (!product._warnings) product._warnings = [];
    product._warnings.push('Chưa có hình ảnh, tạm thời sử dụng ảnh mặc định');
  }

  if (!product.description) {
    product.description = '';
  }

  if (!product.tags) {
    product.tags = [];
  }

  // Auto-detect category if not provided
  if (!product.category) {
    const lowerName = (product.name || '').toLowerCase();
    if (lowerName.includes('màn hình') || lowerName.includes('proart') || lowerName.includes('monitor')) {
      product.category = 'monitor';
    } else if (lowerName.includes('bàn phím') || lowerName.includes('keyboard') || lowerName.includes('phím cơ')) {
      product.category = 'keyboard';
    } else if (lowerName.includes('chuột') || lowerName.includes('mouse')) {
      product.category = 'mouse';
    } else if (lowerName.includes('tai nghe') || lowerName.includes('headset') || lowerName.includes('headphone')) {
      product.category = 'headset';
    } else if (lowerName.includes('usb') || lowerName.includes('thẻ nhớ') || lowerName.includes('sd card') || lowerName.includes('ổ cứng') || lowerName.includes('ssd')) {
      product.category = 'usb';
    } else if (lowerName.includes('lót chuột') || lowerName.includes('pad') || lowerName.includes('deskpad') || lowerName.includes('arm') || lowerName.includes('kê tay')) {
      product.category = 'other';
    } else {
      product.category = 'other';
      if (!product._warnings) product._warnings = [];
      product._warnings.push('Không có danh mục, đặt mặc định là "Sản phẩm khác"');
    }
  }

  // Ensure specs object exists for bidirectional mirroring
  if (!product.specs) {
    product.specs = {};
  }

  // ==========================================
  // SMART BIDIRECTIONAL SYNC BY CATEGORY
  // ==========================================

  // 1. MONITOR SYNC
  if (product.category === 'monitor') {
    // Columns -> Specs dictionary
    if (product.screen_size && !product.specs['Kích thước']) product.specs['Kích thước'] = product.screen_size;
    if (product.resolution && !product.specs['Độ phân giải']) product.specs['Độ phân giải'] = product.resolution;
    if (product.refresh_rate && !product.specs['Tần số quét']) product.specs['Tần số quét'] = product.refresh_rate;
    if (product.panel_type && !product.specs['Tấm nền']) product.specs['Tấm nền'] = product.panel_type;
    if (product.response_time && !product.specs['Thời gian phản hồi']) product.specs['Thời gian phản hồi'] = product.response_time;
    if (product.vesa_mount && !product.specs['Ngàm VESA']) product.specs['Ngàm VESA'] = product.vesa_mount;
    if (product.connection_types?.length && !product.specs['Cổng kết nối']) {
      product.specs['Cổng kết nối'] = product.connection_types.join(', ');
    }

    // Specs dictionary -> Columns (for storefront filters)
    if (!product.screen_size && product.specs['Kích thước']) product.screen_size = product.specs['Kích thước'];
    if (!product.resolution && product.specs['Độ phân giải']) product.resolution = product.specs['Độ phân giải'];
    if (!product.refresh_rate && product.specs['Tần số quét']) product.refresh_rate = product.specs['Tần số quét'];
    if (!product.panel_type && product.specs['Tấm nền']) product.panel_type = product.specs['Tấm nền'];
    if (!product.response_time && product.specs['Thời gian phản hồi']) product.response_time = product.specs['Thời gian phản hồi'];
    if (!product.vesa_mount && product.specs['Ngàm VESA']) product.vesa_mount = product.specs['Ngàm VESA'];
  }

  // 2. KEYBOARD SYNC
  if (product.category === 'keyboard') {
    // Columns -> Specs
    if (product.form_factor && !product.specs['Loại bàn phím']) product.specs['Loại bàn phím'] = product.form_factor;
    if (product.led_type && !product.specs['Đèn LED']) product.specs['Đèn LED'] = product.led_type;
    if (product.connection_types?.length && !product.specs['Kết nối']) product.specs['Kết nối'] = product.connection_types.join(', ');
    if (product.compatibility?.length && !product.specs['Tương thích']) product.specs['Tương thích'] = product.compatibility.join(', ');

    // Specs -> Columns (for storefront filters)
    if (!product.form_factor) {
      product.form_factor = product.specs['Loại bàn phím'] || product.specs['Form Factor'] || product.specs['Layout'] || product.specs['Kích thước'];
    }
    if (!product.led_type) {
      product.led_type = product.specs['Đèn LED'] || product.specs['LED'];
    }
    if ((!product.connection_types || product.connection_types.length === 0) && product.specs['Kết nối']) {
      product.connection_types = parseArray(product.specs['Kết nối'], /[,\n\r;]+/);
    }
    if ((!product.compatibility || product.compatibility.length === 0) && product.specs['Tương thích']) {
      product.compatibility = parseArray(product.specs['Tương thích'], /[,\n\r;]+/);
    }
    if ((!product.features_detailed || product.features_detailed.length === 0) && product.features?.length) {
      product.features_detailed = [...product.features];
    }
  }

  // 3. MOUSE SYNC
  if (product.category === 'mouse') {
    // Columns -> Specs
    if (product.led_type && !product.specs['Đèn LED']) product.specs['Đèn LED'] = product.led_type;
    if (product.connection_types?.length && !product.specs['Kết nối']) product.specs['Kết nối'] = product.connection_types.join(', ');
    if (product.compatibility?.length && !product.specs['Tương thích']) product.specs['Tương thích'] = product.compatibility.join(', ');
    // @ts-expect-error - Custom mouse field
    if (product.dpi && !product.specs['DPI']) product.specs['DPI'] = String(product.dpi);
    // @ts-expect-error - Custom mouse field
    if (product.sensor && !product.specs['Cảm biến']) product.specs['Cảm biến'] = String(product.sensor);

    // Specs -> Columns
    if (!product.led_type) {
      product.led_type = product.specs['Đèn LED'] || product.specs['LED'];
    }
    // @ts-expect-error - Custom mouse field
    if (!product.dpi && product.specs['DPI']) {
      // @ts-expect-error - Custom mouse field
      product.dpi = product.specs['DPI'];
    }
    // @ts-expect-error - Custom mouse field
    if (!product.sensor && product.specs['Cảm biến']) {
      // @ts-expect-error - Custom mouse field
      product.sensor = product.specs['Cảm biến'];
    }
    if ((!product.connection_types || product.connection_types.length === 0) && product.specs['Kết nối']) {
      product.connection_types = parseArray(product.specs['Kết nối'], /[,\n\r;]+/);
    }
    if ((!product.compatibility || product.compatibility.length === 0) && product.specs['Tương thích']) {
      product.compatibility = parseArray(product.specs['Tương thích'], /[,\n\r;]+/);
    }
    if ((!product.features_detailed || product.features_detailed.length === 0) && product.features?.length) {
      product.features_detailed = [...product.features];
    }
  }

  // 4. HEADSET SYNC
  if (product.category === 'headset') {
    // Columns -> Specs
    if (product.headset_type && !product.specs['Loại tai nghe']) product.specs['Loại tai nghe'] = product.headset_type;
    if (product.use_cases?.length && !product.specs['Nhu cầu sử dụng']) product.specs['Nhu cầu sử dụng'] = product.use_cases.join(', ');
    if (product.connection_types?.length && !product.specs['Cổng kết nối']) product.specs['Cổng kết nối'] = product.connection_types.join(', ');

    // Specs -> Columns
    if (!product.headset_type) {
      product.headset_type = product.specs['Loại tai nghe'] || product.specs['Kiểu tai nghe'];
    }
    if ((!product.use_cases || product.use_cases.length === 0) && (product.specs['Nhu cầu sử dụng'] || product.specs['Nhu cầu'])) {
      product.use_cases = parseArray(product.specs['Nhu cầu sử dụng'] || product.specs['Nhu cầu'], /[,\n\r;]+/);
    }
    if ((!product.connection_types || product.connection_types.length === 0) && (product.specs['Cổng kết nối'] || product.specs['Kết nối'])) {
      product.connection_types = parseArray(product.specs['Cổng kết nối'] || product.specs['Kết nối'], /[,\n\r;]+/);
    }
    if ((!product.features_detailed || product.features_detailed.length === 0) && product.features?.length) {
      product.features_detailed = [...product.features];
    }
  }

  // 5. USB & STORAGE SYNC
  if (product.category === 'usb') {
    // Columns -> Specs
    if (product.storage_capacity && !product.specs['Dung lượng']) product.specs['Dung lượng'] = product.storage_capacity;
    if (product.usb_type && !product.specs['Loại USB']) product.specs['Loại USB'] = product.usb_type;
    if (product.read_speed && !product.specs['Tốc độ đọc']) product.specs['Tốc độ đọc'] = product.read_speed;
    if (product.write_speed && !product.specs['Tốc độ ghi']) product.specs['Tốc độ ghi'] = product.write_speed;
    if (product.memory_card_type && !product.specs['Loại thẻ nhớ']) product.specs['Loại thẻ nhớ'] = product.memory_card_type;

    // Specs -> Columns
    if (!product.storage_capacity) {
      product.storage_capacity = product.specs['Dung lượng'] || product.specs['Bộ nhớ'];
    }
    if (!product.usb_type) {
      product.usb_type = product.specs['Loại USB'] || product.specs['Chuẩn USB'] || product.specs['Chuẩn kết nối'];
    }
    if (!product.read_speed) product.read_speed = product.specs['Tốc độ đọc'];
    if (!product.write_speed) product.write_speed = product.specs['Tốc độ ghi'];
    if (!product.memory_card_type) product.memory_card_type = product.specs['Loại thẻ nhớ'] || product.specs['Thẻ nhớ'];
  }

  // 6. OTHER PRODUCTS SYNC
  if (product.category === 'other') {
    // Columns -> Specs
    if (product.product_type && !product.specs['Loại sản phẩm']) product.specs['Loại sản phẩm'] = product.product_type;
    if (product.material && !product.specs['Chất liệu']) product.specs['Chất liệu'] = product.material;

    // Specs -> Columns
    if (!product.product_type) {
      product.product_type = product.specs['Loại sản phẩm'] || product.specs['Phân loại'];
    }
    if (!product.material) {
      product.material = product.specs['Chất liệu'] || product.specs['Vật liệu'];
    }
  }

  return product;
};

/**
 * Parse number safely handling Vietnamese formats, dots, commas, spaces, currency symbols
 */
export const parseNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  if (typeof value === 'string') {
    let str = value.replace(/[₫đVNDvnd\s]/g, '').trim();
    if (!str) return 0;
    
    // Multiple dots (e.g. 9.890.000) -> thousand separators in VN format
    if ((str.match(/\./g) || []).length > 1) {
      str = str.replace(/\./g, '');
    }
    // Multiple commas (e.g. 9,890,000) -> thousand separators in US format
    if ((str.match(/,/g) || []).length > 1) {
      str = str.replace(/,/g, '');
    }

    // If both dot and comma exist (e.g. 9.890.000,00 or 9,890,000.00)
    if (str.includes('.') && str.includes(',')) {
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        // VN format 9.890.000,50 -> 9890000.50
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // US format 9,890,000.50 -> 9890000.50
        str = str.replace(/,/g, '');
      }
    } else if (str.includes('.') && /^\d{1,4}\.\d{3}$/.test(str)) {
      // VN format with 1 dot (e.g. 15.000 or 9890.000)
      str = str.replace('.', '');
    } else if (str.includes(',') && /^\d{1,4},\d{3}$/.test(str)) {
      // US format with 1 comma (e.g. 15,000 or 9890,000)
      str = str.replace(',', '');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num);
  }
  
  return 0;
};

/**
 * Parse array from string with multiple delimiters
 */
export const parseArray = (value: unknown, separator?: string | RegExp): string[] => {
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean);
  }
  
  if (typeof value === 'string') {
    const sep = separator || /[,\n\r;]+/;
    return value.split(sep).map(item => item.trim()).filter(Boolean);
  }

  if (typeof value === 'number') {
    return [String(value)];
  }
  
  return [];
};

/**
 * Parse specs from "Key1:Value1;Key2:Value2" format, preserving colons in values (e.g. 16:9, 1000:1)
 */
export const parseSpecs = (value: unknown): Record<string, string> | undefined => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  
  if (typeof value === 'string' && value.trim()) {
    const specs: Record<string, string> = {};
    const pairs = value.split(/[;\n\r]+/).map(item => item.trim()).filter(Boolean);
    
    pairs.forEach(pair => {
      const firstColonIdx = pair.indexOf(':');
      if (firstColonIdx > 0) {
        const key = pair.substring(0, firstColonIdx).trim();
        const val = pair.substring(firstColonIdx + 1).trim();
        if (key && val) {
          specs[key] = val;
        }
      }
    });
    
    return Object.keys(specs).length > 0 ? specs : undefined;
  }
  
  return undefined;
};

/**
 * Parse boolean from various formats
 */
export const parseBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === 'có' || lower === '1' || lower === 'bật';
  }
  
  if (typeof value === 'number') {
    return value === 1;
  }
  
  return false;
};

/**
 * Parse stock status string to standard enum
 */
export const parseStockStatus = (value: unknown): 'in_stock' | 'low_stock' | 'out_of_stock' | undefined => {
  if (typeof value !== 'string') return undefined;
  const lower = value.toLowerCase().trim();
  if (lower === 'còn hàng' || lower === 'con hang' || lower === 'in_stock' || lower === 'instock' || lower === 'sẵn sàng') {
    return 'in_stock';
  }
  if (lower === 'hết hàng' || lower === 'het hang' || lower === 'out_of_stock' || lower === 'outofstock' || lower === 'liên hệ' || lower === 'lien he') {
    return 'out_of_stock';
  }
  if (lower === 'sắp hết' || lower === 'low_stock' || lower === 'lowstock') {
    return 'low_stock';
  }
  return undefined;
};

/**
 * Map Vietnamese category to standard English key
 */
export const mapCategory = (value: unknown): string => {
  if (typeof value !== 'string') {
    return 'other';
  }
  
  const normalized = value.toLowerCase().trim();
  return CATEGORY_MAPPING[normalized] || normalized;
};

/**
 * Generate Excel template for download with 2 Sheets:
 * - Sheet 1: Products (with real ASUS ProArt monitor example at row 1)
 * - Sheet 2: Hướng dẫn & Danh mục (Instructions & field reference)
 */
export const generateExcelTemplate = (): void => {
  // Multi-category sample rows covering all tabs
  const templateData = [
    {
      // Row 1: ASUS ProArt 2K Monitor
      'Tên sản phẩm': 'Màn hình ASUS ProArt PA278CV 27 inch 2K IPS 75Hz',
      'Thương hiệu': 'ASUS',
      'Danh mục': 'monitor',
      'Danh mục con': 'proart',
      'Loại': 'physical',
      'Giá bán (VND)': 9890000,
      'Giá gốc (VND)': 11490000,
      'Tồn kho': 15,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '27 inch',
      'Độ phân giải': '2K QHD (2560 x 1440)',
      'Tần số quét': '75Hz',
      'Tấm nền': 'IPS',
      'Thời gian phản hồi': '5ms',
      'Cổng kết nối': 'USB-C (PD 65W), HDMI 1.4, DisplayPort 1.2, USB Hub',
      'Ngàm VESA': '100x100 mm',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': 'Windows, MacOS',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': '',
      'SKU': 'ASUS-PA278CV',
      'Mô tả': 'Màn hình chuyên đồ họa ASUS ProArt Display PA278CV 27 inch, độ phân giải 2K QHD, chuẩn màu 100% sRGB và Rec.709, chứng nhận Calman Verified, cổng USB-C sạc 65W.',
      'Tính năng': 'Đạt chuẩn màu 100% sRGB và 100% Rec.709;Chứng nhận Calman Verified với Delta E < 2;Cổng USB-C sạc 65W và truyền dữ liệu;Thiết kế công thái học xoay nâng hạ 4 chiều',
      'Thông số kỹ thuật': 'Kích thước:27 inch;Độ phân giải:2560 x 1440 (2K);Tấm nền:IPS;Tần số quét:75Hz;Độ sáng:350 cd/m²;Độ tương phản:1000:1;Tỷ lệ khung hình:16:9;Chuẩn màu:100% sRGB, Delta E < 2;Loa tích hợp:2W x 2',
      'Thẻ tag': 'asus,proart,man-hinh,do-hoa,2k,ips,75hz,type-c',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://dlcdnwebimgs.asus.com/gain/proart-pa278cv-front.jpg,https://dlcdnwebimgs.asus.com/gain/proart-pa278cv-side.jpg',
    },
    {
      // Row 2: ASUS ProArt 4K Monitor
      'Tên sản phẩm': 'Màn hình ASUS ProArt PA329CV 32 inch 4K IPS HDR400',
      'Thương hiệu': 'ASUS',
      'Danh mục': 'monitor',
      'Danh mục con': 'proart',
      'Loại': 'physical',
      'Giá bán (VND)': 17990000,
      'Giá gốc (VND)': 19990000,
      'Tồn kho': 8,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '32 inch',
      'Độ phân giải': '4K UHD (3840 x 2160)',
      'Tần số quét': '60Hz',
      'Tấm nền': 'IPS',
      'Thời gian phản hồi': '5ms',
      'Cổng kết nối': 'USB-C (PD 90W), HDMI 2.0, DisplayPort 1.2, 4x USB 3.2',
      'Ngàm VESA': '100x100 mm',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': 'Windows, MacOS',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': '',
      'SKU': 'ASUS-PA329CV',
      'Mô tả': 'Màn hình ASUS ProArt Display PA329CV kích thước 32 inch 4K UHD tuyệt đỉnh cho nhà sáng tạo nội dung, hỗ trợ chuẩn DisplayHDR 400 và kết nối Type-C sạc 90W.',
      'Tính năng': 'Màn hình 32 inch 4K UHD siêu sắc nét;100% sRGB, Delta E < 2 Calman Verified;Chứng nhận VESA DisplayHDR 400;Cổng USB-C hỗ trợ sạc nhanh 90W',
      'Thông số kỹ thuật': 'Kích thước:32 inch;Độ phân giải:3840 x 2160 (4K);Tấm nền:IPS;Tần số quét:60Hz;Độ sáng:400 cd/m²;Độ tương phản:1000:1;Tỷ lệ khung hình:16:9;HDR:DisplayHDR 400;Loa:2W x 2',
      'Thẻ tag': 'asus,proart,4k,32-inch,do-hoa,chuyen-nghiep,usb-c-90w',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://dlcdnwebimgs.asus.com/gain/proart-pa329cv.jpg',
    },
    {
      // Row 3: Bàn phím cơ ASUS ROG Falchion (Non-Akko Keyboard sample)
      'Tên sản phẩm': 'Bàn phím cơ không dây ASUS ROG Falchion RX Low Profile',
      'Thương hiệu': 'ASUS',
      'Danh mục': 'keyboard',
      'Danh mục con': 'gaming',
      'Loại': 'physical',
      'Giá bán (VND)': 3990000,
      'Giá gốc (VND)': 4490000,
      'Tồn kho': 20,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': 'Wireless 2.4GHz SpeedNova, Bluetooth, USB-C',
      'Ngàm VESA': '',
      'Loại bàn phím': 'Compact 65%',
      'Đèn LED': 'RGB',
      'Tương thích': 'Windows, MacOS',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': 'Khung nhôm CNC',
      'SKU': 'ASUS-ROG-FALCHION-RX',
      'Mô tả': 'Bàn phím cơ gaming siêu mỏng ASUS ROG Falchion RX Low Profile switch quang học RX Red bôi trơn sẵn, hỗ trợ 3 chế độ kết nối và pin lên đến 436 giờ.',
      'Tính năng': 'Switch ROG RX Red Low-Profile siêu nhạy;Khung nhôm sang trọng tích hợp thanh cảm ứng tương tác;Kết nối 3 chế độ không độ trễ;Thời lượng pin bền bỉ đến 436 giờ',
      'Thông số kỹ thuật': 'Layout:65%;Switch:ROG RX Low-Profile Red;Đèn LED:Aura Sync RGB;Kết nối:2.4GHz / Bluetooth / Type-C;Trọng lượng:595g;Chất liệu keycap:ABS phủ UV',
      'Thẻ tag': 'asus,rog,falchion,ban-phim-co,low-profile,wireless,rgb',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://dlcdnwebimgs.asus.com/gain/rog-falchion-rx.jpg',
    },
    {
      // Row 4: Bàn phím cơ Keychron Q1 Pro (Non-Akko Custom Keyboard sample)
      'Tên sản phẩm': 'Bàn phím cơ Keychron Q1 Pro QMK/VIA Wireless RGB Knob',
      'Thương hiệu': 'Keychron',
      'Danh mục': 'keyboard',
      'Danh mục con': 'custom',
      'Loại': 'physical',
      'Giá bán (VND)': 4590000,
      'Giá gốc (VND)': 4990000,
      'Tồn kho': 12,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': 'Bluetooth 5.1, USB-C',
      'Ngàm VESA': '',
      'Loại bàn phím': '75%',
      'Đèn LED': 'RGB',
      'Tương thích': 'MacOS, Windows, Linux',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': 'Nhôm nguyên khối CNC',
      'SKU': 'KEYCHRON-Q1-PRO',
      'Mô tả': 'Bàn phím cơ custom cao cấp Keychron Q1 Pro vỏ nhôm nguyên khối, mạch xuôi Hotswap, thiết kế Double Gasket Mount và núm xoay Knob đa năng.',
      'Tính năng': 'Thiết kế Double-Gasket Mount êm ái;Hỗ trợ hoàn toàn QMK/VIA lập trình phím;Mạch xuôi South-Facing RGB;Kết nối tối đa 3 thiết bị cùng lúc',
      'Thông số kỹ thuật': 'Layout:75%;Khung:Nhôm CNC;Switch:Keychron K Pro;Pin:4000mAh;Kết nối:Bluetooth / Type-C;Keycap:KSA Double-shot PBT',
      'Thẻ tag': 'keychron,q1-pro,ban-phim-co,custom,gasket,hotswap,rgb',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://example.com/keychron-q1-pro.jpg',
    },
    {
      // Row 5: Chuột Logitech G Pro X Superlight 2
      'Tên sản phẩm': 'Chuột không dây Logitech G Pro X Superlight 2 Lightspeed',
      'Thương hiệu': 'Logitech',
      'Danh mục': 'mouse',
      'Danh mục con': 'gaming',
      'Loại': 'physical',
      'Giá bán (VND)': 3690000,
      'Giá gốc (VND)': 3990000,
      'Tồn kho': 25,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': 'Lightspeed Wireless, USB-C',
      'Ngàm VESA': '',
      'Loại bàn phím': '',
      'Đèn LED': 'Không LED',
      'Tương thích': 'Windows, MacOS',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': 'Nhựa siêu nhẹ',
      'SKU': 'LOGI-GPROX-SUPERLIGHT2',
      'Mô tả': 'Chuột gaming không dây đỉnh cao Logitech G Pro X Superlight 2 trọng lượng siêu nhẹ 60g, cảm biến HERO 2 32000 DPI và switch lai quang học cơ học Lightforce.',
      'Tính năng': 'Trọng lượng siêu nhẹ chỉ 60g;Cảm biến HERO 2 độ phân giải 32.000 DPI;Switch cơ-quang học Lightforce siêu bền;Thời lượng pin lên đến 95 giờ',
      'Thông số kỹ thuật': 'DPI:100 - 32000;Cảm biến:HERO 2;Trọng lượng:60g;Tần số phản hồi:2000Hz (0.5ms);Thời lượng pin:95 giờ;Cổng sạc:USB-C',
      'Thẻ tag': 'logitech,mouse,superlight-2,gaming,wireless,hero-2',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://example.com/logitech-superlight-2.jpg',
    },
    {
      // Row 6: Tai nghe Gaming HyperX Cloud III Wireless
      'Tên sản phẩm': 'Tai nghe không dây HyperX Cloud III Wireless 7.1',
      'Thương hiệu': 'HyperX',
      'Danh mục': 'headset',
      'Danh mục con': 'gaming',
      'Loại': 'physical',
      'Giá bán (VND)': 3490000,
      'Giá gốc (VND)': 3990000,
      'Tồn kho': 18,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': 'Wireless 2.4GHz Dongle, USB-C',
      'Ngàm VESA': '',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': 'PC, PS5, PS4, Nintendo Switch',
      'Loại tai nghe': 'Over-ear (Chụp tai)',
      'Nhu cầu sử dụng': 'Gaming, Đàm thoại, Xem phim',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': '',
      'Chất liệu': 'Khung nhôm, Đệm mút hoạt tính bọc da',
      'SKU': 'HYPERX-CLOUD-III-WL',
      'Mô tả': 'Tai nghe gaming không dây HyperX Cloud III Wireless với driver 53mm góc nghiêng, âm thanh vòm DTS Headphone:X Spatial Audio và pin khủng tới 120 giờ.',
      'Tính năng': 'Thời lượng pin lên đến 120 giờ liên tục;Driver 53mm tinh chỉnh âm thanh sống động;Đệm mút ký ức êm ái huyền thoại HyperX;Micro 10mm khử ồn có đèn LED báo tắt mic',
      'Thông số kỹ thuật': 'Driver:53mm Neodymium;Tần số đáp ứng:10Hz - 21kHz;Pin:120 giờ;Âm thanh:DTS Headphone:X;Microphone:Khử ồn đa hướng;Trọng lượng:330g',
      'Thẻ tag': 'hyperx,cloud-iii,headset,tai-nghe,gaming,wireless,dts-7.1',
      'Nổi bật': 'true',
      'Hình ảnh': 'https://example.com/hyperx-cloud-iii.jpg',
    },
    {
      // Row 7: Ổ cứng SSD di động Kingston (USB & Storage)
      'Tên sản phẩm': 'Ổ cứng di động SSD Kingston XS1000 1TB Type-C USB 3.2 Gen 2',
      'Thương hiệu': 'Kingston',
      'Danh mục': 'usb',
      'Danh mục con': 'storage',
      'Loại': 'physical',
      'Giá bán (VND)': 2190000,
      'Giá gốc (VND)': 2590000,
      'Tồn kho': 40,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': 'USB Type-C, USB 3.2 Gen 2',
      'Ngàm VESA': '',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': 'Windows, MacOS, Android, iPadOS',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '1TB',
      'Loại USB': 'Type-C USB 3.2',
      'Loại sản phẩm phụ': '',
      'Chất liệu': 'Kim loại kết hợp nhựa',
      'SKU': 'KINGSTON-XS1000-1TB',
      'Mô tả': 'Ổ cứng thể rắn gắn ngoài SSD di động Kingston XS1000 1TB kích thước bỏ túi siêu nhỏ gọn, tốc độ đọc lên đến 1.050MB/s truyền tệp cực nhanh.',
      'Tính năng': 'Kích thước siêu nhỏ gọn chỉ nặng 29g;Tốc độ đọc lên tới 1.050MB/s, ghi 1.000MB/s;Chuẩn kết nối USB 3.2 Gen 2 băng thông 10Gbps;Bảo hành 5 năm chính hãng',
      'Thông số kỹ thuật': 'Dung lượng:1TB;Tốc độ đọc:1050 MB/s;Tốc độ ghi:1000 MB/s;Giao tiếp:USB 3.2 Gen 2 Type-C;Kích thước:69.54 x 32.58 x 13.5 mm;Trọng lượng:28.7g',
      'Thẻ tag': 'kingston,ssd,xs1000,1tb,usb-c,o-cung-di-dong,toc-do-cao',
      'Nổi bật': 'false',
      'Hình ảnh': 'https://example.com/kingston-xs1000.jpg',
    },
    {
      // Row 8: Thẻ nhớ SanDisk Extreme Pro (USB & Storage)
      'Tên sản phẩm': 'Thẻ nhớ MicroSDXC SanDisk Extreme Pro 128GB 200MB/s A2 V30',
      'Thương hiệu': 'SanDisk',
      'Danh mục': 'usb',
      'Danh mục con': 'memory-card',
      'Loại': 'physical',
      'Giá bán (VND)': 450000,
      'Giá gốc (VND)': 590000,
      'Tồn kho': 80,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': '',
      'Ngàm VESA': '',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': 'Điện thoại, Flycam, GoPro, Nintendo Switch, Camera',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '128GB',
      'Loại USB': 'MicroSDXC UHS-I',
      'Loại sản phẩm phụ': '',
      'Chất liệu': '',
      'SKU': 'SANDISK-EXTREME-PRO-128',
      'Mô tả': 'Thẻ nhớ MicroSD SanDisk Extreme Pro 128GB đạt tốc độ đọc 200MB/s, chuẩn V30 quay video 4K UHD mượt mà và chuẩn A2 tải ứng dụng tốc độ cao.',
      'Tính năng': 'Tốc độ đọc tối đa 200MB/s với công nghệ SanDisk QuickFlow;Chuẩn Video Speed Class 30 (V30) quay video 4K sắc nét;Chuẩn A2 khởi chạy ứng dụng nhanh chóng;Chống sốc, chống nhiệt độ, chống nước và tia X',
      'Thông số kỹ thuật': 'Dung lượng:128GB;Tốc độ đọc:200 MB/s;Tốc độ ghi:90 MB/s;Chuẩn:microSDXC UHS-I, U3, V30, A2',
      'Thẻ tag': 'sandisk,microsd,128gb,the-nho,4k,gopro,flycam',
      'Nổi bật': 'false',
      'Hình ảnh': 'https://example.com/sandisk-128gb.jpg',
    },
    {
      // Row 9: Lót chuột ASUS ROG (Other / Accessories sample)
      'Tên sản phẩm': 'Lót chuột cỡ lớn Gaming ASUS ROG Scabbard II Chống Nước',
      'Thương hiệu': 'ASUS',
      'Danh mục': 'other',
      'Danh mục con': 'mousepad',
      'Loại': 'physical',
      'Giá bán (VND)': 990000,
      'Giá gốc (VND)': 1190000,
      'Tồn kho': 35,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': '',
      'Ngàm VESA': '',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': '',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': 'Lót chuột (Deskpad)',
      'Chất liệu': 'Vải dệt Nano chống nước, Đế cao su chống trượt',
      'SKU': 'ASUS-ROG-SCABBARD-II',
      'Mô tả': 'Tấm lót chuột gaming khổ lớn ASUS ROG Scabbard II kích thước 900x400mm phủ lớp phủ nano chuẩn quân sự chống nước, dầu và bụi bẩn với viền may chống sờn.',
      'Tính năng': 'Lớp phủ Nano bảo vệ cấp độ quân đội chống thấm nước và dầu;Kích thước siêu lớn 900 x 400 mm trải trọn bàn làm việc;Đường may viền phẳng chống sờn rách;Đế cao su chống trượt tuyệt đối',
      'Thông số kỹ thuật': 'Kích thước:900 x 400 x 3 mm;Bề mặt:Vải dệt phủ Nano;Đế:Cao su chống trượt;Trọng lượng:650g',
      'Thẻ tag': 'asus,rog,lot-chuot,mousepad,deskpad,chong-nuoc,gaming',
      'Nổi bật': 'false',
      'Hình ảnh': 'https://dlcdnwebimgs.asus.com/gain/rog-scabbard-ii.jpg',
    },
    {
      // Row 10: Arm màn hình (Other sample)
      'Tên sản phẩm': 'Giá treo màn hình Arm Human Motion T6 Pro Đơn 17-32 inch',
      'Thương hiệu': 'Human Motion',
      'Danh mục': 'other',
      'Danh mục con': 'arm',
      'Loại': 'physical',
      'Giá bán (VND)': 1250000,
      'Giá gốc (VND)': 1450000,
      'Tồn kho': 20,
      'Trạng thái kho': 'Còn hàng',
      'Kích thước màn hình': '',
      'Độ phân giải': '',
      'Tần số quét': '',
      'Tấm nền': '',
      'Thời gian phản hồi': '',
      'Cổng kết nối': '',
      'Ngàm VESA': '75x75, 100x100 mm',
      'Loại bàn phím': '',
      'Đèn LED': '',
      'Tương thích': '',
      'Loại tai nghe': '',
      'Nhu cầu sử dụng': '',
      'Dung lượng': '',
      'Loại USB': '',
      'Loại sản phẩm phụ': 'Giá treo màn hình (Arm)',
      'Chất liệu': 'Hợp kim nhôm nguyên khối, Thép cao cấp',
      'SKU': 'HUMAN-MOTION-T6-PRO',
      'Mô tả': 'Tay nâng giá treo màn hình Human Motion T6 Pro cơ chế trợ lực Gas Spring chịu tải tới 9kg, nâng hạ xoay 360 độ linh hoạt cho setup bàn làm việc chuyên nghiệp.',
      'Tính năng': 'Piston trợ lực khí nén Gas Spring êm ái bền bỉ;Hỗ trợ màn hình kích thước 17 đến 32 inch, tải trọng 9kg;Hỗ trợ ngàm VESA 75x75 và 100x100mm;Quản lý giấu dây cáp gọn gàng',
      'Thông số kỹ thuật': 'Kích thước màn hình hỗ trợ:17 - 32 inch;Tải trọng:2 - 9 kg;Chuẩn VESA:75x75 mm, 100x100 mm;Góc nghiêng:+90° đến -45°;Góc xoay:360°;Cách lắp:Kẹp bàn hoặc khoan lỗ',
      'Thẻ tag': 'arm,gia-treo-man-hinh,human-motion,t6-pro,vesa,setup-desk',
      'Nổi bật': 'false',
      'Hình ảnh': 'https://example.com/human-motion-t6-pro.jpg',
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'San_Pham_Mau');

  // Set column widths for Sheet 1
  worksheet['!cols'] = [
    { wch: 40 }, // Tên sản phẩm
    { wch: 15 }, // Thương hiệu
    { wch: 15 }, // Danh mục
    { wch: 15 }, // Danh mục con
    { wch: 10 }, // Loại
    { wch: 15 }, // Giá bán
    { wch: 15 }, // Giá gốc
    { wch: 10 }, // Tồn kho
    { wch: 14 }, // Trạng thái kho
    { wch: 20 }, // Kích thước màn hình
    { wch: 24 }, // Độ phân giải
    { wch: 12 }, // Tần số quét
    { wch: 12 }, // Tấm nền
    { wch: 18 }, // Thời gian phản hồi
    { wch: 35 }, // Cổng kết nối
    { wch: 16 }, // Ngàm VESA
    { wch: 16 }, // Loại bàn phím
    { wch: 14 }, // Đèn LED
    { wch: 25 }, // Tương thích
    { wch: 22 }, // Loại tai nghe
    { wch: 25 }, // Nhu cầu sử dụng
    { wch: 14 }, // Dung lượng
    { wch: 18 }, // Loại USB
    { wch: 24 }, // Loại sản phẩm phụ
    { wch: 30 }, // Chất liệu
    { wch: 24 }, // SKU
    { wch: 60 }, // Mô tả
    { wch: 65 }, // Tính năng
    { wch: 75 }, // Thông số kỹ thuật
    { wch: 35 }, // Thẻ tag
    { wch: 10 }, // Nổi bật
    { wch: 60 }, // Hình ảnh
  ];

  // Sheet 2: Guidelines & Categories Reference for all 6 categories
  const guideData = [
    { 'Danh mục (Tiếng Việt)': 'Màn Hình', 'Mã danh mục (Category ID)': 'monitor', 'Các bộ lọc tương ứng trên web': 'Thương hiệu, Kích thước (24", 27", 32"...), Độ phân giải (FHD, 2K, 4K...), Tần số quét (60Hz, 75Hz, 144Hz...), Tấm nền (IPS, VA, OLED...), Cổng kết nối (Type-C, HDMI, DP), Tính năng màn hình', 'Ví dụ sản phẩm': 'Màn hình ASUS ProArt PA278CV, ROG Strix XG27ACS, Dell UltraSharp' },
    { 'Danh mục (Tiếng Việt)': 'Bàn Phím', 'Mã danh mục (Category ID)': 'keyboard', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Akko, ASUS, Keychron, Logitech...), Kết nối (2.4GHz, Bluetooth, Type-C), Tương thích (Windows, MacOS), Loại bàn phím (Full-size, TKL, 75%, 65%), Đèn LED (RGB, Đơn sắc), Tiện ích', 'Ví dụ sản phẩm': 'Bàn phím cơ ASUS ROG Falchion, Keychron Q1 Pro, Akko 3084B Plus' },
    { 'Danh mục (Tiếng Việt)': 'Chuột', 'Mã danh mục (Category ID)': 'mouse', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Logitech, Razer, ASUS, Pulsar...), Kết nối (Không dây Lightspeed, Bluetooth, Type-C), Tương thích, Đèn LED, Tiện ích (Siêu nhẹ, Cảm biến HERO...)', 'Ví dụ sản phẩm': 'Chuột Logitech G Pro X Superlight 2, ASUS ROG Harpe Ace' },
    { 'Danh mục (Tiếng Việt)': 'Tai Nghe', 'Mã danh mục (Category ID)': 'headset', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (HyperX, ASUS, Sony...), Cổng kết nối, Loại tai nghe (Over-ear chụp tai, In-ear nhét tai, True Wireless), Nhu cầu sử dụng (Gaming, Văn phòng, Nghe nhạc), Tính năng (Âm thanh 7.1, Chống ồn ANC)', 'Ví dụ sản phẩm': 'Tai nghe ASUS ROG Delta II, HyperX Cloud III Wireless' },
    { 'Danh mục (Tiếng Việt)': 'USB & Phụ Kiện', 'Mã danh mục (Category ID)': 'usb', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Kingston, SanDisk, Samsung...), Dung lượng (32GB, 64GB, 128GB, 256GB, 1TB...), Loại USB (USB 3.2, Type-C), Tốc độ đọc, Tốc độ ghi, Loại thẻ nhớ (MicroSD, SD)', 'Ví dụ sản phẩm': 'SSD Kingston XS1000 1TB, Thẻ nhớ SanDisk Extreme Pro 128GB' },
    { 'Danh mục (Tiếng Việt)': 'Sản Phẩm Khác', 'Mã danh mục (Category ID)': 'other', 'Các bộ lọc tương ứng trên web': 'Thương hiệu, Loại sản phẩm (Lót chuột / Mousepad, Giá treo Arm màn hình, Kê tay, Giá đỡ tai nghe), Chất liệu (Vải dệt Nano, Nhôm CNC, Da PU), Khoảng giá', 'Ví dụ sản phẩm': 'Lót chuột ASUS ROG Scabbard II, Arm Human Motion T6 Pro' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc giá tiền', 'Mã danh mục (Category ID)': 'price_vnd', 'Các bộ lọc tương ứng trên web': 'Có thể nhập số nguyên (VD: 9890000) hoặc có dấu chấm phân cách hàng nghìn kiểu Việt Nam (VD: 9.890.000 hoặc 9.890.000đ). Hệ thống tự chuẩn hóa.', 'Ví dụ sản phẩm': '9890000 hoặc 9.890.000đ' },
    { 'Danh mục (Tiếng Việt)': 'Giá ban đầu / Giá gốc', 'Mã danh mục (Category ID)': 'original_price_vnd', 'Các bộ lọc tương ứng trên web': 'Nếu để trống hoặc không nhập, hệ thống sẽ tự động gán giá gốc bằng giá bán hiện tại. Khi hai giá bằng nhau, web chỉ hiển thị giá bán duy nhất (không gạch ngang).', 'Ví dụ sản phẩm': 'Để trống hoặc nhập bằng Giá bán (VND)' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc hình ảnh', 'Mã danh mục (Category ID)': 'images', 'Các bộ lọc tương ứng trên web': 'Nhiều link ảnh phân cách bằng dấu phẩy (,), dấu chấm phẩy (;) hoặc xuống dòng (Alt+Enter trong ô Excel).', 'Ví dụ sản phẩm': 'https://link1.jpg, https://link2.jpg' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc thông số KT', 'Mã danh mục (Category ID)': 'specs', 'Các bộ lọc tương ứng trên web': 'Định dạng Tên: Giá trị; ngăn cách bằng dấu chấm phẩy (;). Dù bạn điền vào cột riêng hay cột Specs, hệ thống đều tự đồng bộ 2 chiều.', 'Ví dụ sản phẩm': 'Kích thước: 27 inch; Tấm nền: IPS; Độ tương phản: 1000:1; Tỷ lệ: 16:9' },
  ];

  const guideSheet = XLSX.utils.json_to_sheet(guideData);
  guideSheet['!cols'] = [
    { wch: 22 }, // Danh mục
    { wch: 24 }, // Mã danh mục
    { wch: 65 }, // Các bộ lọc tương ứng
    { wch: 45 }, // Ví dụ sản phẩm
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong_Dan_DanhMuc');

  // Trigger download
  XLSX.writeFile(workbook, 'mau-nhap-san-pham-fbox-shop.xlsx');
};

/**
 * Export failed rows to Excel
 */
export const exportFailedRows = (failedProducts: ParsedProduct[]): void => {
  const exportData = failedProducts.map(product => {
    const row: Record<string, unknown> = {
      'Dòng': product._row,
      'Lỗi cần sửa': product._errors?.join('; ') ?? '',
      'Cảnh báo': product._warnings?.join('; ') ?? '',
      'Tên sản phẩm': product.name || '',
      'Thương hiệu': product.brand || '',
      'Danh mục': product.category || '',
      'Giá bán (VND)': product.price_vnd || '',
      'Giá gốc (VND)': product.original_price_vnd || '',
      'SKU': product.sku || '',
      'Tồn kho': product.stock || '',
    };
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Failed Rows');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  XLSX.writeFile(workbook, `loi-nhap-san-pham-${timestamp}.xlsx`);
};

/**
 * Export products from database to Excel file matching the import format.
 * Structure of exported file is 100% compatible with parseExcelFile & validateProducts.
 */
export const exportProductsToExcel = (products: Product[], customFilename?: string): void => {
  if (!products || products.length === 0) {
    throw new Error('Danh sách sản phẩm trống, không thể xuất file Excel.');
  }

  const exportData = products.map((product) => {
    // 1. Determine stock value
    const parsedP = product as ParsedProduct;
    const stockVal = typeof parsedP.stock === 'number'
      ? parsedP.stock
      : (product.stock_status === 'out_of_stock' ? 0 : 10);

    // 2. Determine stock status text matching parseStockStatus
    let stockStatusLabel = 'Còn hàng';
    if (product.stock_status === 'out_of_stock') {
      stockStatusLabel = 'Hết hàng';
    } else if (product.stock_status === 'low_stock') {
      stockStatusLabel = 'Sắp hết';
    }

    // 3. Format specs cleanly as Key1:Value1;Key2:Value2
    let specsStr = '';
    if (product.specs && typeof product.specs === 'object') {
      specsStr = Object.entries(product.specs)
        .filter(([k, v]) => k && v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => `${String(k).trim()}:${String(v).trim()}`)
        .join(';');
    }

    // 4. Clean images list (comma-separated URLs)
    const imagesStr = Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean).map(url => String(url).trim()).join(',')
      : '';

    // 5. Clean tags (comma-separated)
    const tagsStr = Array.isArray(product.tags) && product.tags.length > 0
      ? product.tags.filter(Boolean).map(tag => String(tag).trim()).join(',')
      : '';

    // 6. Clean features (semicolon-separated)
    const featuresStr = Array.isArray(product.features) && product.features.length > 0
      ? product.features.filter(Boolean).map(f => String(f).trim()).join(';')
      : '';

    // 7. Clean connection types & compatibility (comma-separated)
    const connectionStr = Array.isArray(product.connection_types) && product.connection_types.length > 0
      ? product.connection_types.filter(Boolean).map(c => String(c).trim()).join(', ')
      : '';

    const compatibilityStr = Array.isArray(product.compatibility) && product.compatibility.length > 0
      ? product.compatibility.filter(Boolean).map(c => String(c).trim()).join(', ')
      : '';

    const useCasesStr = Array.isArray(product.use_cases) && product.use_cases.length > 0
      ? product.use_cases.filter(Boolean).map(u => String(u).trim()).join(', ')
      : '';

    // 8. Prices: ensure valid numbers
    const priceVnd = typeof product.price_vnd === 'number' ? product.price_vnd : (Number(product.price_vnd) || 0);
    const originalPriceVnd = (product.original_price_vnd !== undefined && product.original_price_vnd !== null && Number(product.original_price_vnd) > 0)
      ? Number(product.original_price_vnd)
      : priceVnd;

    return {
      'Tên sản phẩm': product.name || '',
      'Thương hiệu': product.brand || '',
      'Danh mục': product.category || 'other',
      'Danh mục con': product.subcategory || '',
      'Loại': product.type || 'physical',
      'Giá bán (VND)': priceVnd,
      'Giá gốc (VND)': originalPriceVnd,
      'Tồn kho': stockVal,
      'Trạng thái kho': stockStatusLabel,
      'Kích thước màn hình': product.screen_size || '',
      'Độ phân giải': product.resolution || '',
      'Tần số quét': product.refresh_rate || '',
      'Tấm nền': product.panel_type || '',
      'Thời gian phản hồi': product.response_time || '',
      'Cổng kết nối': connectionStr,
      'Ngàm VESA': product.vesa_mount || '',
      'Loại bàn phím': product.form_factor || '',
      'Đèn LED': product.led_type || '',
      'Tương thích': compatibilityStr,
      'Loại tai nghe': product.headset_type || '',
      'Nhu cầu sử dụng': useCasesStr,
      'Dung lượng': product.storage_capacity || '',
      'Loại USB': product.usb_type || '',
      'Loại sản phẩm phụ': product.product_type || '',
      'Chất liệu': product.material || '',
      'SKU': product.sku || '',
      'Mô tả': product.description || '',
      'Tính năng': featuresStr,
      'Thông số kỹ thuật': specsStr,
      'Thẻ tag': tagsStr,
      'Nổi bật': product.featured ? 'true' : 'false',
      'Hình ảnh': imagesStr,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Set column widths matching the 32 columns cleanly
  worksheet['!cols'] = [
    { wch: 40 }, // Tên sản phẩm
    { wch: 15 }, // Thương hiệu
    { wch: 15 }, // Danh mục
    { wch: 15 }, // Danh mục con
    { wch: 10 }, // Loại
    { wch: 15 }, // Giá bán
    { wch: 15 }, // Giá gốc
    { wch: 10 }, // Tồn kho
    { wch: 14 }, // Trạng thái kho
    { wch: 20 }, // Kích thước màn hình
    { wch: 24 }, // Độ phân giải
    { wch: 12 }, // Tần số quét
    { wch: 12 }, // Tấm nền
    { wch: 18 }, // Thời gian phản hồi
    { wch: 35 }, // Cổng kết nối
    { wch: 16 }, // Ngàm VESA
    { wch: 16 }, // Loại bàn phím
    { wch: 14 }, // Đèn LED
    { wch: 25 }, // Tương thích
    { wch: 22 }, // Loại tai nghe
    { wch: 25 }, // Nhu cầu sử dụng
    { wch: 14 }, // Dung lượng
    { wch: 18 }, // Loại USB
    { wch: 24 }, // Loại sản phẩm phụ
    { wch: 30 }, // Chất liệu
    { wch: 24 }, // SKU
    { wch: 60 }, // Mô tả
    { wch: 65 }, // Tính năng
    { wch: 75 }, // Thông số kỹ thuật
    { wch: 35 }, // Thẻ tag
    { wch: 10 }, // Nổi bật
    { wch: 60 }, // Hình ảnh
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_San_Pham');

  // Sheet 2: Guidelines & Categories Reference
  const guideData = [
    { 'Danh mục (Tiếng Việt)': 'Màn Hình', 'Mã danh mục (Category ID)': 'monitor', 'Các bộ lọc tương ứng trên web': 'Thương hiệu, Kích thước (24", 27", 32"...), Độ phân giải (FHD, 2K, 4K...), Tần số quét (60Hz, 75Hz, 144Hz...), Tấm nền (IPS, VA, OLED...), Cổng kết nối (Type-C, HDMI, DP), Tính năng màn hình', 'Ví dụ sản phẩm': 'Màn hình ASUS ProArt PA278CV, ROG Strix XG27ACS, Dell UltraSharp' },
    { 'Danh mục (Tiếng Việt)': 'Bàn Phím', 'Mã danh mục (Category ID)': 'keyboard', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Akko, ASUS, Keychron, Logitech...), Kết nối (2.4GHz, Bluetooth, Type-C), Tương thích (Windows, MacOS), Loại bàn phím (Full-size, TKL, 75%, 65%), Đèn LED (RGB, Đơn sắc), Tiện ích', 'Ví dụ sản phẩm': 'Bàn phím cơ ASUS ROG Falchion, Keychron Q1 Pro, Akko 3084B Plus' },
    { 'Danh mục (Tiếng Việt)': 'Chuột', 'Mã danh mục (Category ID)': 'mouse', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Logitech, Razer, ASUS, Pulsar...), Kết nối (Không dây Lightspeed, Bluetooth, Type-C), Tương thích, Đèn LED, Tiện ích (Siêu nhẹ, Cảm biến HERO...)', 'Ví dụ sản phẩm': 'Chuột Logitech G Pro X Superlight 2, ASUS ROG Harpe Ace' },
    { 'Danh mục (Tiếng Việt)': 'Tai Nghe', 'Mã danh mục (Category ID)': 'headset', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (HyperX, ASUS, Sony...), Cổng kết nối, Loại tai nghe (Over-ear chụp tai, In-ear nhét tai, True Wireless), Nhu cầu sử dụng (Gaming, Văn phòng, Nghe nhạc), Tính năng (Âm thanh 7.1, Chống ồn ANC)', 'Ví dụ sản phẩm': 'Tai nghe ASUS ROG Delta II, HyperX Cloud III Wireless' },
    { 'Danh mục (Tiếng Việt)': 'USB & Phụ Kiện', 'Mã danh mục (Category ID)': 'usb', 'Các bộ lọc tương ứng trên web': 'Thương hiệu (Kingston, SanDisk, Samsung...), Dung lượng (32GB, 64GB, 128GB, 256GB, 1TB...), Loại USB (USB 3.2, Type-C), Tốc độ đọc, Tốc độ ghi, Loại thẻ nhớ (MicroSD, SD)', 'Ví dụ sản phẩm': 'SSD Kingston XS1000 1TB, Thẻ nhớ SanDisk Extreme Pro 128GB' },
    { 'Danh mục (Tiếng Việt)': 'Sản Phẩm Khác', 'Mã danh mục (Category ID)': 'other', 'Các bộ lọc tương ứng trên web': 'Thương hiệu, Loại sản phẩm (Lót chuột / Mousepad, Giá treo Arm màn hình, Kê tay, Giá đỡ tai nghe), Chất liệu (Vải dệt Nano, Nhôm CNC, Da PU), Khoảng giá', 'Ví dụ sản phẩm': 'Lót chuột ASUS ROG Scabbard II, Arm Human Motion T6 Pro' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc giá tiền', 'Mã danh mục (Category ID)': 'price_vnd', 'Các bộ lọc tương ứng trên web': 'Có thể nhập số nguyên (VD: 9890000) hoặc có dấu chấm phân cách hàng nghìn kiểu Việt Nam (VD: 9.890.000 hoặc 9.890.000đ). Hệ thống tự chuẩn hóa.', 'Ví dụ sản phẩm': '9890000 hoặc 9.890.000đ' },
    { 'Danh mục (Tiếng Việt)': 'Giá ban đầu / Giá gốc', 'Mã danh mục (Category ID)': 'original_price_vnd', 'Các bộ lọc tương ứng trên web': 'Nếu để trống hoặc không nhập, hệ thống sẽ tự động gán giá gốc bằng giá bán hiện tại. Khi hai giá bằng nhau, web chỉ hiển thị giá bán duy nhất (không gạch ngang).', 'Ví dụ sản phẩm': 'Để trống hoặc nhập bằng Giá bán (VND)' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc hình ảnh', 'Mã danh mục (Category ID)': 'images', 'Các bộ lọc tương ứng trên web': 'Nhiều link ảnh phân cách bằng dấu phẩy (,), dấu chấm phẩy (;) hoặc xuống dòng (Alt+Enter trong ô Excel).', 'Ví dụ sản phẩm': 'https://link1.jpg, https://link2.jpg' },
    { 'Danh mục (Tiếng Việt)': 'Quy tắc thông số KT', 'Mã danh mục (Category ID)': 'specs', 'Các bộ lọc tương ứng trên web': 'Định dạng Tên: Giá trị; ngăn cách bằng dấu chấm phẩy (;). Dù bạn điền vào cột riêng hay cột Specs, hệ thống đều tự đồng bộ 2 chiều.', 'Ví dụ sản phẩm': 'Kích thước: 27 inch; Tấm nền: IPS; Độ tương phản: 1000:1; Tỷ lệ: 16:9' },
  ];

  const guideSheet = XLSX.utils.json_to_sheet(guideData);
  guideSheet['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 65 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(workbook, guideSheet, 'Huong_Dan_DanhMuc');

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const filename = customFilename || `danh-sach-san-pham-${dateStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
};

