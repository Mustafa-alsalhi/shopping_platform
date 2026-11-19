import type { Product, SellerCategory } from './catalog.model';

export interface User {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: 'customer' | 'seller' | 'driver' | 'admin';
  is_active: boolean;
  is_online?: boolean;
  work_zone?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  avatar?: string;
  seller_status?: string;
  seller?: Seller;
  driver_profile?: Driver;
  created_at?: string;
}

export interface Seller {
  id: number;
  user_id?: number;
  name?: string;
  store_name: string;
  description?: string;
  logo?: string;
  avatar?: string;
  avatar_image?: string;
  cover_image?: string;
  type: string;
  rating: number;
  reviews_count: number;
  products_count?: number;
  status: string;
  is_verified: boolean;
  is_open: boolean;
  accepting_orders: boolean;
  preparation_time?: string;
  delivery_time?: string;
  delivery_fee?: number;
  min_order_amount: number;
  minimum_order?: number;
  working_hours?: string;
  cuisine_type?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  seller_categories?: SellerCategory[];
  products?: Product[];
}

export interface Driver {
  id: number;
  user_id: number;
  personal_photo?: string;
  emergency_contact_phone?: string;
  vehicle_type?: string;
  vehicle_plate_number?: string;
  vehicle_number?: string;
  id_card_image?: string;
  kuraimi_account?: string;
  is_verified: boolean;
  status?: string;
}
