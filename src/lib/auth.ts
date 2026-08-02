import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const SALT_ROUNDS = 10;
const DEV_FALLBACK_SECRET = 'honghong-simulator-dev-secret-key';
let cachedSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.JWT_SECRET || process.env.COZE_SUPABASE_ANON_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET (or COZE_SUPABASE_ANON_KEY) must be set in production');
    }
    cachedSecret = new TextEncoder().encode(DEV_FALLBACK_SECRET);
    return cachedSecret;
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}

export const TOKEN_NAME = 'auth-token';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: TOKEN_MAX_AGE,
  path: '/',
};

/** Hash a plaintext password with bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/** Verify a plaintext password against a bcrypt hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Create a JWT token for a user */
export async function createToken(payload: { userId: number; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE}s`)
    .sign(getJwtSecret());
}

/** Verify and decode a JWT token */
export async function verifyToken(token: string): Promise<{ userId: number; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as { userId: number; username: string };
  } catch {
    return null;
  }
}

/** Set the auth cookie on a NextResponse */
export function setAuthCookieOnResponse(response: NextResponse, token: string): void {
  response.cookies.set({
    name: TOKEN_NAME,
    value: token,
    ...COOKIE_OPTIONS,
  });
}

/** Clear the auth cookie on a NextResponse */
export function clearAuthCookieOnResponse(response: NextResponse): void {
  response.cookies.set({
    name: TOKEN_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

/** Get the current user from the auth cookie (server-side) */
export async function getCurrentUser(): Promise<{ userId: number; username: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Get the current user from a request, supporting both cookie and Bearer token.
 * Priority: Bearer token (Authorization header) > cookie
 * This dual approach ensures auth works even when cookies are not sent (e.g., cross-origin).
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<{ userId: number; username: string } | null> {
  // 1. Try Bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = await verifyToken(token);
    if (user) return user;
  }

  // 2. Fallback to cookie
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (token) {
    const user = await verifyToken(token);
    if (user) return user;
  }

  return null;
}
