// Product Variant Types
export interface VariantAttribute {
  name: string;         // Internal name: "color", "switch_type", "size"
  display_name: string; // Display name: "Màu sắc", "Loại Switch", "Kích thước"
  values: string[];     // ["Pink", "Blue", "Green"]
}

export interface ProductVariant {
  id: string;                           // "var_001"
  sku: string;                          // "AKKO-5098B-PINK-GAT"
  attributes: Record<string, string>;   // { "color": "Pink", "switch_type": "Gateron" }
  price_adjustment: number;             // +0, +200000, -50000 (relative to base_price)
  stock: number;                        // 5
  is_available: boolean;                // true/false
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price_vnd: number;
  price_virtual: number;
  original_price_vnd?: number;
  category: string;
  subcategory: string;
  tags: string[];
  type: 'physical' | 'digital';
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  featured: boolean;
  is_free?: boolean;
  // Product Variants fields
  has_variants?: boolean;              // true if product has variants
  sku?: string;                        // Base SKU (e.g., "AKKO-5098B")
  base_price?: number;                 // Base price when has_variants = true
  variant_attributes?: VariantAttribute[]; // Attribute definitions
  variants?: ProductVariant[];         // List of all variants
  digital_file?: string;
  file_size?: string;
  specs?: Record<string, string>;
  features?: string[];
  rating?: number;
  review_count?: number;
  discount?: number;
  created_at: string;
  // New detailed filter fields
  brand?: string;
  connection_types?: string[];
  compatibility?: string[];
  form_factor?: string;
  led_type?: string;
  features_detailed?: string[];
  // Headset specific fields
  headset_type?: string;
  use_cases?: string[];
  // Monitor specific fields
  screen_size?: string;
  refresh_rate?: string;
  resolution?: string;
  response_time?: string;
  panel_type?: string;
  monitor_features?: string[];
  vesa_mount?: string;
  // USB/Storage specific fields
  storage_capacity?: string;
  usb_type?: string;
  read_speed?: string;
  write_speed?: string;
  memory_card_type?: string;
  // Digital product specific fields
  content_type?: string;
  digital_resolution?: string;
  format_type?: string;
  license_type?: string;
  software_compatibility?: string[];
  // Other products specific fields
  price_range?: string;
  product_type?: string;
  material?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'physical' | 'digital';
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  description: string;
}

// Search & Filter Types
export interface SearchFilters {
  category?: string;
  subcategory?: string;
  type?: 'physical' | 'digital';
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  isFree?: boolean;
  sortBy?: 'newest' | 'name' | 'price_low' | 'price_high' | 'popular';
  query?: string;
}

// Site Configuration
export interface SiteConfig {
  site: {
    name: string;
    tagline: string;
    description: string;
    currency: {
      primary: string;
      virtual: string;
      virtual_name: string;
      exchange_rate: number;
    };
    contact: {
      facebook: string;
      discord: string;
      facebook_text: string;
      discord_text: string;
    };
    payment_info: {
      vnd_instruction: string;
      virtual_instruction: string;
      free_instruction: string;
    };
  };
  features: {
    dual_payment: boolean;
    free_downloads: boolean;
    no_registration: boolean;
    social_commerce: boolean;
  };
  theme: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
    dark_mode: boolean;
  };
}

// Payment Types
export interface PaymentOption {
  type: 'vnd' | 'virtual' | 'free';
  amount: number;
  currency_name: string;
  redirect_url?: string;
  instruction: string;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
  url: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'feature' | 'unfeature';
  productId: string;
  productName: string;
  timestamp: string;
  details?: string;
  category?: string;
}

// Legacy types (keeping for compatibility)
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string; // Selected variant ID if product has variants
}