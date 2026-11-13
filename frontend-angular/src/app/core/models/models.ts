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

export interface Activity {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  banner_title?: string;
  banner_subtitle?: string;
  banner_bg?: string;
  banner_image?: string;
  place_label?: string;
  item_label?: string;
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: number;
  name: string;
  type: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  is_active: boolean;
  show_on_homepage?: boolean;
  products_count?: number;
}

export interface SellerCategory {
  id: number;
  seller_id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  description: string;
  detailed_description?: string;
  price: number;
  old_price?: number;
  sale_price?: number;
  compare_at_price?: number;
  currency?: string;
  sku?: string;
  image?: string;
  image_url?: string;
  images?: string[];
  category_id: number;
  seller_category_id?: number;
  seller_id?: number;
  stock: number;
  rating: number;
  reviews_count: number;
  featured?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  status?: string;
  preparation_time?: number | string;
  food_options?: any;
  category?: Category;
  seller?: Seller;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  type?: string;
  price?: number;
  options?: VariantOption[];
}

export interface VariantOption {
  id: number;
  variant_id?: number;
  product_variant_id?: number;
  name?: string;
  value?: string;
  price?: number;
  price_delta?: number;
  color_code?: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  unit_price?: number;
  price?: number;
  selected_options?: any;
  special_instructions?: string;
  product?: Product;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total?: number;
  total_amount: number;
  status: string;
  seller_status?: string;
  payment_status: string;
  payment_method?: string;
  shipping_address: any;
  latitude?: number;
  longitude?: number;
  formatted_address?: string;
  building_details?: string;
  notes?: string;
  driver_id?: number;
  driver_status?: string;
  delivery_code?: string;
  created_at: string;
  user?: User;
  driver?: User;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
  total: number;
  selected_options?: any;
  product?: Product;
}

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

export interface Setting {
  id?: number;
  store_name?: string;
  store_description?: string;
  store_logo?: string;
  store_favicon?: string;
  store_email?: string;
  store_phone?: string;
  store_address?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  whatsapp_url?: string;
  maintenance_mode?: boolean;
  maintenance_message?: string;
  delivery_zones?: any;
}

