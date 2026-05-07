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
    pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    shipped:   'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
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
