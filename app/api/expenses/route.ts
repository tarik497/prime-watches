export const dynamic = 'force-dynamic';
// app/api/expenses/route.ts — Admin expense management

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentAdmin } from '@/lib/auth';

// GET /api/expenses — admin only
export async function GET(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  let query = supabaseAdmin.from('expenses').select('*').order('expense_date', { ascending: false });
  if (type && type !== 'all') query = query.eq('type', type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: data });
}

// POST /api/expenses — admin only
export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, amount, description, expense_date } = body;

  if (!type || !amount) {
    return NextResponse.json({ error: 'Type and amount are required' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('expenses')
    .insert({
      type, amount: parseFloat(amount), description,
      admin_id: admin.id, admin_name: admin.name,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense: data }, { status: 201 });
}
