export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { format, subDays } from 'date-fns';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function n(v: any): number { return parseFloat(v) || 0; }

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ordersRes, expensesRes] = await Promise.all([
    supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('expenses').select('*'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw   = (ordersRes.data  ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exRaw = (expensesRes.data ?? []) as any[];

  const orders = raw.map(o => ({
    ...o,
    total_price:    n(o.total_price),
    profit:         n(o.profit),
    selling_price:  n(o.selling_price),
    purchase_price: n(o.purchase_price),
    delivery_cost:  n(o.delivery_cost),
    packaging_cost: n(o.packaging_cost),
    quantity:       n(o.quantity) || 1,
  }));

  const expenses = exRaw.map(e => ({ ...e, amount: n(e.amount) }));

  const nonCancelled  = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue  = nonCancelled.reduce((s: number, o) => s + o.total_price, 0);
  const totalProfit   = nonCancelled.reduce((s: number, o) => s + o.profit, 0);
  const totalExpenses = expenses.reduce((s: number, e) => s + e.amount, 0);
  const realProfit    = totalProfit - totalExpenses;

  const revenueByDay = [];
  for (let i = 29; i >= 0; i--) {
    const day     = subDays(new Date(), i);
    const dateStr = format(day, 'dd/MM');
    const dayOrders = nonCancelled.filter(o =>
      new Date(o.created_at).toDateString() === day.toDateString()
    );
    revenueByDay.push({
      date:    dateStr,
      revenue: dayOrders.reduce((s: number, o) => s + o.total_price, 0),
      profit:  dayOrders.reduce((s: number, o) => s + o.profit, 0),
    });
  }

  const statusCounts: Record<string, number> = {};
  orders.forEach(o => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
  const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  return NextResponse.json({
    totalRevenue:    parseFloat(totalRevenue.toFixed(2)),
    totalProfit:     parseFloat(totalProfit.toFixed(2)),
    totalExpenses:   parseFloat(totalExpenses.toFixed(2)),
    realProfit:      parseFloat(realProfit.toFixed(2)),
    totalOrders:     orders.length,
    pendingOrders:   orders.filter(o => o.status === 'pending').length,
    confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length,
    recentOrders:    orders.slice(0, 10),
    revenueByDay,
    ordersByStatus,
  });
}
