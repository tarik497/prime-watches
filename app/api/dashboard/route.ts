export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { format, subDays } from 'date-fns';

function toNum(v: unknown): number {
  return parseFloat(String(v ?? 0)) || 0;
}

interface OrderRow {
  id: string;
  status: string;
  created_at: string;
  total_price: number;
  profit: number;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('expenses').select('*'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: OrderRow[] = (ordersRes.data ?? []).map((o: any) => ({
    ...o,
    id:             String(o.id ?? ''),
    status:         String(o.status ?? 'pending'),
    created_at:     String(o.created_at ?? ''),
    total_price:    toNum(o.total_price),
    profit:         toNum(o.profit),
    selling_price:  toNum(o.selling_price),
    purchase_price: toNum(o.purchase_price),
    delivery_cost:  toNum(o.delivery_cost),
    packaging_cost: toNum(o.packaging_cost),
    quantity:       toNum(o.quantity),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expenses = (expensesRes.data ?? []).map((e: any) => ({
    ...e,
    amount: toNum(e.amount),
  }));

  const nonCancelled  = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue  = parseFloat(nonCancelled.reduce((s, o) => s + o.total_price, 0).toFixed(2));
  const totalProfit   = parseFloat(nonCancelled.reduce((s, o) => s + o.profit, 0).toFixed(2));
  const totalExpenses = parseFloat(expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0).toFixed(2));
  const realProfit    = parseFloat((totalProfit - totalExpenses).toFixed(2));

  const revenueByDay: { date: string; revenue: number; profit: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day       = subDays(new Date(), i);
    const dateStr   = format(day, 'dd/MM');
    const dayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.toDateString() === day.toDateString() && o.status !== 'cancelled';
    });
    revenueByDay.push({
      date:    dateStr,
      revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
      profit:  dayOrders.reduce((s, o) => s + o.profit, 0),
    });
  }

  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    totalRevenue,
    totalProfit,
    totalExpenses,
    realProfit,
    totalOrders:     orders.length,
    pendingOrders:   orders.filter(o => o.status === 'pending').length,
    confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    recentOrders:    orders.slice(0, 10),
    revenueByDay,
    ordersByStatus,
  });
}
