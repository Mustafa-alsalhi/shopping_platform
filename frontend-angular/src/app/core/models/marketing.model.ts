import type { Seller } from './user.model';
import type { Product } from './catalog.model';

export interface Banner {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
  sort_order: number;
  position: string;
  type: string;
}

export interface Offer {
  id: number;
  seller_id?: number;
  title: string;
  slug?: string;
  description?: string;
  discount_percentage?: number;
  discount_value?: number;
  discount_type?: string;
  original_price?: number;
  discount_price?: number;
  image?: string;
  banner?: string;
  thumbnail?: string;
  valid_until?: string;
  end_date?: string;
  featured?: boolean;
  active?: boolean;
  status?: string;
  seller?: Seller;
  products?: Product[];
}

export interface Coupon {
  id: number;
  seller_id?: number;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimum_amount?: number;
  min_order_amount?: number;
  usage_limit?: number;
  used_count: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
}
