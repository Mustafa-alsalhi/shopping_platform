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
