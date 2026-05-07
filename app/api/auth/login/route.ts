export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !admin)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await verifyPassword(password, admin.password);
    if (!valid)
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = signToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    });

    // Set cookie directly on the response
    response.cookies.set('pw_admin_token', token, {
      httpOnly: true,
      secure: false,        // false for localhost
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,  // 7 days
    });

    return response;

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}