import { NextResponse } from 'next/server';
import { clearAuthCookieOnResponse } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: '已退出登录' });
  clearAuthCookieOnResponse(response);
  return response;
}
