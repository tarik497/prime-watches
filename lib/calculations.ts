// lib/calculations.ts
// Core business logic: profit, revenue, real profit calculations

import type { Order, Expense } from './types';

/**
 * Calculate the profit for a single order.
 * profit = sellingPrice - (purchasePrice + packagingCost + deliveryCost)
 */
export function calculateOrderProfit(
  sellingPrice: number,
  purchasePrice: number,
  packagingCost: number,
  deliveryCost: number,
  quantity = 1
): number {
  const revenue = sellingPrice * quantity;
  const cost = (purchasePrice + packagingCost) * quantity + deliveryCost;
  return parseFloat((revenue - cost).toFixed(2));
}

/**
 * Calculate total price shown to customer.
 * total = sellingPrice * qty + deliveryCost
 */
export function calculateOrderTotal(
  sellingPrice: number,
  deliveryCost: number,
  quantity = 1
): number {
  return parseFloat((sellingPrice * quantity + deliveryCost).toFixed(2));
}

/**
 * Sum profits from all orders (delivered + confirmed are "realized").
 */
export function sumOrderProfits(orders: Order[]): number {
  return parseFloat(
    orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.profit, 0)
      .toFixed(2)
  );
}

/**
 * Sum total revenue from all non-cancelled orders.
 */
export function sumRevenue(orders: Order[]): number {
  return parseFloat(
    orders
      .filter(o => o.status !== 'cancelled')
      .reduce((acc, o) => acc + o.total_price, 0)
      .toFixed(2)
  );
}

/**
 * Sum all expenses.
 */
export function sumExpenses(expenses: Expense[]): number {
  return parseFloat(
    expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2)
  );
}

/**
 * REAL BUSINESS PROFIT = sum of order profits - sum of all expenses.
 * This is the bottom-line number the business owner cares about most.
 */
export function calculateRealProfit(orders: Order[], expenses: Expense[]): number {
  const orderProfit = sumOrderProfits(orders);
  const totalExpenses = sumExpenses(expenses);
  return parseFloat((orderProfit - totalExpenses).toFixed(2));
}

/**
 * Format number as Algerian Dinar.
 */
export function formatDA(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA';
}

/**
 * Get status badge color classes.
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending:   'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
    confirmed: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
    shipped:   'bg-purple-500/20 text-purple-300 border border-purple-500/40',
    delivered: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    cancelled: 'bg-red-500/20 text-red-300 border border-red-500/40',
  };
  return map[status] ?? 'bg-obsidian-700 text-obsidian-300 border border-obsidian-600';
}

/**
 * Get Arabic/French label for order status.
 */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending:   'En attente',
    confirmed: 'Confirmée',
    shipped:   'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
  };
  return map[status] ?? status;
}

export function getPromoPrice(product: {
  selling_price: number;
  promo_active?: boolean;
  promo_type?: 'percentage' | 'fixed' | null;
  promo_value?: number | null;
}): number | null {
  if (!product.promo_active || !product.promo_type || !product.promo_value) return null;
  if (product.promo_type === 'percentage') {
    return Math.max(0, parseFloat((product.selling_price * (1 - product.promo_value / 100)).toFixed(2)));
  }
  return Math.max(0, parseFloat((product.selling_price - product.promo_value).toFixed(2)));
}

export function getEffectivePrice(product: {
  selling_price: number;
  promo_active?: boolean;
  promo_type?: 'percentage' | 'fixed' | null;
  promo_value?: number | null;
}): number {
  return getPromoPrice(product) ?? product.selling_price;
}
