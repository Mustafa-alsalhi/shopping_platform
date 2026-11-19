import type { User } from './user.model';
import type { Product } from './catalog.model';

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
