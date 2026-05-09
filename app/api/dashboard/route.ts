export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { sumRevenue, sumOrderProfits, sumExpenses, calculateRealProfit } from '@/lib/calculations';
import { format, subDays } from 'date-fns';
import type { Order, Expense } from '@/lib/types';

// Supabase returns NUMERIC columns as strings — cast everything to number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castOrder(o: any): Order {
  return {
    ...o,
    total_price:    parseFloat(o.total_price    ?? 0),
    profit:         parseFloat(o.profit         ?? 0),
    selling_price:  parseFloat(o.selling_price  ?? 0),
    purchase_price: parseFloat(o.purchase_price ?? 0),
    delivery_cost:  parseFloat(o.delivery_cost  ?? 0),
    packaging_cost: parseFloat(o.packaging_cost ?? 0),
    quantity:       parseInt(o.quantity         ?? 1),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function castExpense(e: any): Expense {
  return { ...e, amount: parseFloat(e.amount ?? 0) };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('expenses').select('*'),
  ]);

  // Cast all numeric fields so arithmetic works correctly
  const orders: Order[]     = (ordersRes.data  ?? []).map(castOrder);
  const expenses: Expense[] = (expensesRes.data ?? []).map(castExpense);

  // Revenue by day (last 30 days)
  const revenueByDay: { date: string; revenue: number; profit: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day     = subDays(new Date(), i);
    const dateStr = format(day, 'dd/MM');
    const dayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.toDateString() === day.toDateString() && o.status !== 'cancelled';
    });
    revenueByDay.push({
      date:    dateStr,
      revenue: parseFloat(dayOrders.reduce((s, o) => s + o.total_price, 0).toFixed(2)),
      profit:  parseFloat(dayOrders.reduce((s, o) => s + o.profit, 0).toFixed(2)),
    });
  }

  // Orders by status
  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    totalRevenue:    sumRevenue(orders),
    totalProfit:     sumOrderProfits(orders),
    totalExpenses:   sumExpenses(expenses),
    realProfit:      calculateRealProfit(orders, expenses),
    totalOrders:     orders.length,
    pendingOrders:   orders.filter(o => o.status === 'pending').length,
    confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    recentOrders:    orders.slice(0, 10),
    revenueByDay,
    ordersByStatus,
  });
}
