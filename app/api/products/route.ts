export const dynamic = 'force-dynamic';
// app/api/products/route.ts — List & Create products

import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';

// GET /api/products — public, returns active products
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const all = searchParams.get('all') === 'true'; // admin: get all including inactive

  let query = supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });

  if (!all) query = query.eq('is_active', true);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

// POST /api/products — admin only
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, purchase_price, selling_price, stock, image_url, category } = body;

  if (!name || purchase_price == null || selling_price == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ name, description, purchase_price, selling_price, stock: stock ?? 0, image_url, category })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}
