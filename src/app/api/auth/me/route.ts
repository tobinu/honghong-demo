import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest, createToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Support both Bearer token and cookie auth
    const user = await getCurrentUserFromRequest(request);
    // If user is authenticated, return a fresh token for Bearer auth
    // This ensures the client always has a valid auth_token in localStorage
    let token: string | undefined;
    if (user) {
      token = await createToken({ userId: user.userId, username: user.username });
    }
    const response = NextResponse.json({ user, token });
    // Prevent caching of auth state
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
