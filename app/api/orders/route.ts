export const dynamic = 'force-dynamic';
// app/api/orders/route.ts — Create order (public) & List orders (admin)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';
import { calculateOrderProfit, calculateOrderTotal } from '@/lib/calculations';

// GET /api/orders — admin only
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  if (search) query = query.ilike('customer_name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

// POST /api/orders — public (no account needed)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_name, customer_phone, customer_address,
      wilaya_code, delivery_type, product_id, quantity = 1, notes, selected_color,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !customer_address || !wilaya_code || !delivery_type || !product_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch product
    const { data: product, error: pErr } = await supabaseAdmin
      .from('products').select('*').eq('id', product_id).eq('is_active', true).single();
    if (pErr || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Check stock
    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Fetch delivery price
    const { data: delivery } = await supabaseAdmin
      .from('delivery_prices').select('*').eq('wilaya_code', wilaya_code).single();
    if (!delivery) return NextResponse.json({ error: 'Wilaya not found' }, { status: 404 });

    // Fetch packaging cost from settings
    const { data: packSetting } = await supabaseAdmin
      .from('settings').select('value').eq('key', 'packaging_cost').single();
    const packagingCost = parseFloat(packSetting?.value || '200');

    // Resolve delivery cost
    const deliveryCost = delivery_type === 'home' ? delivery.home_price : delivery.office_price;

    // Calculate financials
    const totalPrice = calculateOrderTotal(product.selling_price, deliveryCost, quantity);
    const profit = calculateOrderProfit(
      product.selling_price, product.purchase_price, packagingCost, deliveryCost, quantity
    );

    // Create order
    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        customer_name, customer_phone, customer_address,
        wilaya_code, wilaya_name: delivery.wilaya_name, delivery_type,
        product_id, product_name: product.name, product_image: product.image_url,
        quantity, selling_price: product.selling_price, purchase_price: product.purchase_price,
        delivery_cost: deliveryCost, packaging_cost: packagingCost,
        total_price: totalPrice, profit, notes, selected_color: selected_color || null, status: 'pending',
      })
      .select().single();

    if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

    // Decrement stock
    await supabaseAdmin
      .from('products')
      .update({ stock: product.stock - quantity })
      .eq('id', product_id);

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error('Order error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
