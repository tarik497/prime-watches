export const dynamic = 'force-dynamic';
// GET /api/dashboard — aggregated stats + chart data for admin dashboard
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { sumRevenue, sumOrderProfits, sumExpenses, calculateRealProfit } from '@/lib/calculations';
import { format, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('expenses').select('*'),
  ]);

  const orders = ordersRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  // ── Revenue by day (last 30 days) ──────────────────────
  const revenueByDay: { date: string; revenue: number; profit: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = subDays(new Date(), i);
    const dateStr = format(day, 'dd/MM');
    const dayOrders = orders.filter((o: { created_at: string; status: string }) => {
      const d = new Date(o.created_at);
      return d.toDateString() === day.toDateString() && o.status !== 'cancelled';
    });
    revenueByDay.push({
      date: dateStr,
      revenue: dayOrders.reduce((s: number, o: { total_price: number }) => s + o.total_price, 0),
      profit: dayOrders.reduce((s: number, o: { profit: number }) => s + o.profit, 0),
    });
  }

  // ── Orders by status ───────────────────────────────────
  const statusCounts: Record<string, number> = {};
  orders.forEach((o: { status: string }) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    totalRevenue: sumRevenue(orders),
    totalProfit: sumOrderProfits(orders),
    totalExpenses: sumExpenses(expenses),
    realProfit: calculateRealProfit(orders, expenses),
    totalOrders: orders.length,
    pendingOrders: orders.filter((o: { status: string }) => o.status === 'pending').length,
    confirmedOrders: orders.filter((o: { status: string }) => o.status === 'confirmed').length,
    deliveredOrders: orders.filter((o: { status: string }) => o.status === 'delivered').length,
    recentOrders: orders.slice(0, 10),
    revenueByDay,
    ordersByStatus,
  });
}
