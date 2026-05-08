// lib/types.ts — Shared TypeScript types for Prime Watches

export type DeliveryType = 'home' | 'office';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ExpenseType = 'packaging' | 'fuel' | 'other';
export type AdminRole = 'admin' | 'superadmin';

// ── Product ────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  image_url?: string;
  images?: string[];
  category?: string;
  is_active: boolean;
  promo_type?: 'percentage' | 'fixed' | null;// lib/types.ts — Shared TypeScript types for Prime Watches

export type DeliveryType = 'home' | 'office';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ExpenseType = 'packaging' | 'fuel' | 'other';
export type AdminRole = 'admin' | 'superadmin';

// ── Product ────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description?: string;
  purchase_price: number;
  selling_price: number;
  stock: number;
  image_url?: string;
  images?: string[];
  category?: string;
  is_active: boolean;
  color_options?: string[];
  created_at: string;
  updated_at: string;
}

// ── Delivery Price ─────────────────────────────────────────
export interface DeliveryPrice {
  id: string;
  wilaya_code: number;
  wilaya_name: string;
  home_price: number;
  office_price: number;
  updated_at: string;
}

// ── Order ──────────────────────────────────────────────────
export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya_code: number;
  wilaya_name: string;
  delivery_type: DeliveryType;
  product_id?: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  selling_price: number;
  purchase_price: number;
  delivery_cost: number;
  packaging_cost: number;
  total_price: number;
  profit: number;
  status: OrderStatus;
  notes?: string;
  selected_color?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Expense ────────────────────────────────────────────────
export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  description?: string;
  admin_id?: string;
  admin_name?: string;
  expense_date: string;
  created_at: string;
}

// ── Admin ──────────────────────────────────────────────────
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
}

// ── Dashboard Stats ────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  realProfit: number;  // totalProfit - totalExpenses
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
}

// ── Checkout Form ──────────────────────────────────────────
export interface CheckoutForm {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya_code: number;
  delivery_type: DeliveryType;
  notes?: string;
  selected_color?: string | null;
}
  promo_value?: number | null;
  promo_active?: boolean;
  created_at: string;
  updated_at: string;
}

// ── Delivery Price ─────────────────────────────────────────
export interface DeliveryPrice {
  id: string;
  wilaya_code: number;
  wilaya_name: string;
  home_price: number;
  office_price: number;
  is_active?: boolean;
  updated_at: string;
}

// ── Order ──────────────────────────────────────────────────
export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya_code: number;
  wilaya_name: string;
  delivery_type: DeliveryType;
  product_id?: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  selling_price: number;
  purchase_price: number;
  delivery_cost: number;
  packaging_cost: number;
  total_price: number;
  profit: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Expense ────────────────────────────────────────────────
export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  description?: string;
  admin_id?: string;
  admin_name?: string;
  expense_date: string;
  created_at: string;
}

// ── Admin ──────────────────────────────────────────────────
export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
}

// ── Dashboard Stats ────────────────────────────────────────
export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalExpenses: number;
  realProfit: number;  // totalProfit - totalExpenses
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
}

// ── Checkout Form ──────────────────────────────────────────
export interface CheckoutForm {
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  wilaya_code: number;
  delivery_type: DeliveryType;
  notes?: string;
}
