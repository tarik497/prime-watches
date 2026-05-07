// lib/auth.ts
// JWT-based authentication utilities for admin panel

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { Admin } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'prime-watches-secret-change-in-prod';
const COOKIE_NAME = 'pw_admin_token';
const TOKEN_EXPIRY = '7d';

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

/** Hash a plain-text password */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/** Compare plain-text vs hashed password */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Sign a JWT for an admin */
export function signToken(admin: Pick<Admin, 'id' | 'email' | 'name' | 'role'>): string {
  return jwt.sign(
    { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/** Verify and decode a JWT — returns null on failure */
export function verifyToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
  } catch {
    return null;
  }
}

/** Read admin token from request cookies (server-side) */
export function getAdminFromCookies(): AdminTokenPayload | null {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** Cookie name constant */
export { COOKIE_NAME };

/** Get current admin from request cookies (for API route handlers) */
export async function getCurrentAdmin() {
  return getAdminFromCookies();
}

/** Cookie options for set/delete */
export function getAuthCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAge ?? 60 * 60 * 24 * 7, // 7 days
  };
}
