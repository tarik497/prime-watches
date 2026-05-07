export const dynamic = 'force-dynamic';
// GET /api/delivery — list all wilaya delivery prices (public)
// POST /api/delivery — upsert single wilaya price (admin)
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  const { data, error } = await supabase
    .from('delivery_prices').select('*').order('wilaya_code');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prices: data });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { wilaya_code, wilaya_name, home_price, office_price } = await req.json();
  const { error } = await supabaseAdmin.from('delivery_prices').upsert(
    { wilaya_code, wilaya_name, home_price, office_price },
    { onConflict: 'wilaya_code' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
