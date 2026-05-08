export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const all    = searchParams.get('all') === 'true';

  let query = supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (!all) query = query.eq('is_active', true).gt('stock', 0);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, purchase_price, selling_price, stock, image_url, images, category, is_active } = body;

  if (!name || selling_price === undefined)
    return NextResponse.json({ error: 'Name and selling_price required' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('products').insert({
    name, description, purchase_price, selling_price, stock,
    image_url: image_url || (images?.[0] || ''),
    images: images || [],
    category, is_active,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ product: data }, { status: 201 });
}
