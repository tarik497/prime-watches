export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';
import { calculateOrderProfit, calculateOrderTotal } from '@/lib/calculations';
import { randomUUID } from 'crypto';

// GET /api/orders — admin only
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search') || '';

  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  if (search) query = query.ilike('customer_name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

// POST /api/orders — public, supports single item or cart (array)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both single item and array of items (cart)
    const items: typeof body[] = Array.isArray(body.items) ? body.items : [body];

    const {
      customer_name,
      customer_phone,
      customer_address,
      wilaya_code,
      delivery_type,
      notes,
    } = Array.isArray(body.items) ? body : body;

    if (!customer_name || !customer_phone || !customer_address || !wilaya_code || !delivery_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch delivery price once (same wilaya for all items)
    const { data: delivery } = await supabaseAdmin
      .from('delivery_prices')
      .select('*')
      .eq('wilaya_code', wilaya_code)
      .single();
    if (!delivery) return NextResponse.json({ error: 'Wilaya not found' }, { status: 404 });

    // Fetch packaging cost
    const { data: packSetting } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'packaging_cost')
      .single();
    const packagingCost = parseFloat(packSetting?.value || '200');

    const deliveryCost = delivery_type === 'home' ? delivery.home_price : delivery.office_price;

    // Generate a shared group ID for all items in this cart
    // Single item orders also get a group_id (same as their own id after insert)
    const groupId = items.length > 1 ? randomUUID() : null;

    const createdOrders = [];

    for (const item of items) {
      const { product_id, quantity = 1, selected_color } = item;

      if (!product_id) continue;

      // Fetch product
      const { data: product, error: pErr } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', product_id)
        .eq('is_active', true)
        .single();
      if (pErr || !product) continue;

      if (product.stock < quantity) {
        return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 });
      }

      // For multi-item cart: delivery cost only charged once (on first item)
      const isFirst: boolean = createdOrders.length === 0;
      const itemDeliveryCost = items.length === 1 ? deliveryCost : (isFirst ? deliveryCost : 0);

      const effectivePrice = product.promo_active && product.promo_value
        ? (product.promo_type === 'percentage'
            ? product.selling_price * (1 - product.promo_value / 100)
            : product.selling_price - product.promo_value)
        : product.selling_price;

      const totalPrice = calculateOrderTotal(effectivePrice, itemDeliveryCost, quantity);
      const profit = calculateOrderProfit(
        effectivePrice, product.purchase_price, packagingCost, itemDeliveryCost, quantity
      );

      const { data: order, error: oErr } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_name, customer_phone, customer_address,
          wilaya_code, wilaya_name: delivery.wilaya_name, delivery_type,
          product_id, product_name: product.name, product_image: product.image_url,
          quantity, selling_price: effectivePrice, purchase_price: product.purchase_price,
          delivery_cost: itemDeliveryCost, packaging_cost: packagingCost,
          total_price: totalPrice, profit,
          notes: notes || null,
          selected_color: selected_color || null,
          order_group_id: groupId,
          status: 'pending',
        })
        .select()
        .single();

      if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

      // Decrement stock
      await supabaseAdmin
        .from('products')
        .update({ stock: product.stock - quantity })
        .eq('id', product_id);

      createdOrders.push(order);
    }

    if (createdOrders.length === 0) {
      return NextResponse.json({ error: 'Aucun article valide' }, { status: 400 });
    }

    return NextResponse.json({ order: createdOrders[0], orders: createdOrders }, { status: 201 });
  } catch (err) {
    console.error('Order error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
