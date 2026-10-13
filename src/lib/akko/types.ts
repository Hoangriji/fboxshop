import type { Product } from '../../types';

export interface AkkoRawImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface AkkoRawCategory {
  id: number;
  name: string;
  slug: string;
  link: string;
}

export interface AkkoRawAttributeTerm {
  id: number;
  name: string;
  slug: string;
}

export interface AkkoRawAttribute {
  id: number;
  name: string;
  taxonomy: string;
  has_variations: boolean;
  terms: AkkoRawAttributeTerm[];
}

export interface AkkoRawPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: { min_amount: string; max_amount: string } | null;
  currency_code: string;
  currency_symbol: string;
}

export interface AkkoRawProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  sku: string;
  description: string;
  short_description: string;
  type: string;
  prices: AkkoRawPrices;
  images: AkkoRawImage[];
  categories: AkkoRawCategory[];
  tags: Array<{ id: number; name: string; slug: string }>;
  attributes: AkkoRawAttribute[];
  has_options: boolean;
  is_in_stock: boolean;
  is_purchasable: boolean;
}

export interface AkkoParsedProduct extends Omit<Product, 'id'> {
  source: 'akko';
  source_id: number;
  source_url: string;
  source_synced_at: string;
}
