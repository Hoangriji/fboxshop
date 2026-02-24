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
  sku?: string;                        // Product SKU
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
    hero_image_url?: string;  // Hero section background image URL from Cloudinary
    hero_image_public_id?: string;  // Cloudinary public ID for deletion
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
}