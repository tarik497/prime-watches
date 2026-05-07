export const dynamic = 'force-dynamic';
// GET /api/settings — all settings (public)
// POST /api/settings — update multiple settings (admin)
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

export async function GET() {
  const { data, error } = await supabase.from('settings').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const settings: Record<string, string> = {};
  data?.forEach((row: { key: string; value: string }) => { settings[row.key] = row.value; });
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token || !verifyToken(token))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  // body is a key-value map of settings to update
  const upserts = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await supabaseAdmin.from('settings').upsert(upserts, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
