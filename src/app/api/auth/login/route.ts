import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { verifyPassword, createToken, setAuthCookieOnResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const db = getDb();

    const users = await db
      .select({ id: schema.users.id, username: schema.users.username, password: schema.users.password })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const user = users[0];
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = await createToken({ userId: user.id, username: user.username });
    const response = NextResponse.json({
      user: { userId: user.id, username: user.username },
      token,
      message: '登录成功',
    });
    setAuthCookieOnResponse(response, token);

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
