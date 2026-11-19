import type { Seller } from './user.model';

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
