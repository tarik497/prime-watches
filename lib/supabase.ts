// lib/supabase.ts
// Supabase client helpers — browser (anon) + server (service role)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── Public client (browser safe, respects RLS) ──
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Service-role client (server only, bypasses RLS) ──
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
