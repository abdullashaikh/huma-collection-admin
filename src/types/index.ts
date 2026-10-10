export interface AdminUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
}

export interface DashboardStats {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    lowStockCount: number;
  };
  recentOrders: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    order_status: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
  }>;
  lowStockList: Array<{
    id: number;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
    product_name: string;
    product_slug: string;
  }>;
  statusBreakdown: Array<{
    order_status: string;
    count: number;
  }>;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  variant_attributes?: Record<string, string>;
}

export interface Order {
  id: number;
  order_number: string;
  user_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  shipping_address: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  } | string;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: 'RAZORPAY' | 'COD';
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  tracking_number?: string | null;
  carrier_name?: string | null;
  customer_notes?: string | null;
  created_at: string;
  item_count?: number;
  items?: OrderItem[];
}

export interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: number;
}

export type AudienceScope = 'MEN' | 'WOMEN' | 'ALL';

export interface Product {
  id: number;
  category_id: number;
  subcategory_id?: number | null;
  category_name?: string;
  category_slug?: string;
  subcategory_name?: string;
  subcategory_slug?: string;
  audience: AudienceScope;
  name: string;
  slug: string;
  sku_base: string;
  short_description: string;
  description: string;
  fabric?: string | null;
  materials?: string | null;
  pattern?: string | null;
  style?: string | null;
  colors?: any;
  tags?: any;
  care_instructions?: string | null;
  base_price: number;
  sale_price?: number | null;
  display_order?: number;
  is_featured: number | boolean;
  is_bestseller: number | boolean;
  is_new_arrival: number | boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  primary_image_url?: string | null;
  images?: Array<{
    id?: number;
    s3_url?: string;
    s3Url?: string;
    s3_key?: string;
    s3Key?: string;
    alt_text?: string;
    altText?: string;
    sort_order?: number;
    sortOrder?: number;
    is_primary?: boolean | number;
    isPrimary?: boolean;
    view_type?: string;
    viewType?: string;
  }>;
  variants?: ProductVariant[];
  total_stock?: number;
  variant_count?: number;
  created_at: string;
}

export interface Category {
  id: number;
  parent_id?: number | null;
  parent_name?: string | null;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  audience: AudienceScope;
  is_active: number | boolean;
  display_order: number;
  product_count: number;
  seo_title?: string;
  seo_description?: string;
  subcategories?: Category[];
}

export interface InventoryItem {
  variant_id: number;
  sku: string;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  image_url?: string | null;
  category_name?: string;
}

export interface InventoryTransaction {
  id: number;
  variant_id: number;
  sku: string;
  product_name: string;
  transaction_type: string;
  quantity_change: number;
  previous_stock: number;
  current_stock: number;
  reference_type: string;
  notes?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number | null;
  usage_limit_total?: number | null;
  usage_limit_per_user: number;
  times_used: number;
  valid_from: string;
  valid_until: string;
  is_active: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  admin_id?: number | null;
  admin_email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  created_at: string;
}
