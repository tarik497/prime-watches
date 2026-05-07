export const dynamic = 'force-dynamic';
// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set('pw_admin_token', '', { maxAge: 0, path: '/' });
  return res;
}
