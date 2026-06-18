import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { hashPassword, createToken, setAuthCookieOnResponse } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (username.length < 2 || username.length > 50) {
      return NextResponse.json({ error: '用户名长度应为2-50个字符' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6个字符' }, { status: 400 });
    }

    const db = getDb();

    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: '用户名已被占用' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const inserted = await db
      .insert(schema.users)
      .values({ username, password: hashedPassword })
      .returning({ id: schema.users.id, username: schema.users.username });

    if (inserted.length === 0) {
      throw new Error('注册失败：未返回新用户数据');
    }

    const newUser = inserted[0];
    const token = await createToken({ userId: newUser.id, username: newUser.username });
    const response = NextResponse.json({
      user: { userId: newUser.id, username: newUser.username },
      token,
      message: '注册成功',
    });
    setAuthCookieOnResponse(response, token);

    return response;
  } catch (err) {
    console.error('[REGISTER ERROR]:', err);
    const message = err instanceof Error ? err.message : '注册失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
