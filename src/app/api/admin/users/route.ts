import { NextRequest, NextResponse } from "next/server";
import { eq, and, or, ilike, desc, count } from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql";
import { getDb, schema } from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth";

async function verifyAdmin(request: NextRequest): Promise<{ ok: boolean; error: NextResponse | null }> {
  const payload = await getCurrentUserFromRequest(request);
  if (!payload) {
    return { ok: false, error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }

  const db = getDb();
  const rows = await db
    .select({ isAdmin: schema.users.isAdmin })
    .from(schema.users)
    .where(eq(schema.users.id, payload.userId))
    .limit(1);

  if (rows.length === 0 || !rows[0].isAdmin) {
    return { ok: false, error: NextResponse.json({ error: "无管理员权限" }, { status: 403 }) };
  }

  return { ok: true, error: null };
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.ok) return adminCheck.error!;

    const db = getDb();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || "20")));

    const conditions: (SQL | undefined)[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(schema.users.username, `%${search}%`),
          ilike(schema.users.nickname, `%${search}%`)
        )!
      );
    }

    if (status) {
      conditions.push(eq(schema.users.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(schema.users)
      .where(whereClause);

    const data = await db
      .select({
        id: schema.users.id,
        username: schema.users.username,
        nickname: schema.users.nickname,
        status: schema.users.status,
        is_admin: schema.users.isAdmin,
        created_at: schema.users.createdAt,
      })
      .from(schema.users)
      .where(whereClause)
      .orderBy(desc(schema.users.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({ total: totalResult.total, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询用户列表失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.ok) return adminCheck.error!;

    const db = getDb();
    const body = await request.json() as { userId: number; status: string };

    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const allowedStatuses = ["active", "inactive", "banned"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "status 值不合法，只允许 active/inactive/banned" }, { status: 400 });
    }

    const updated = await db
      .update(schema.users)
      .set({ status })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        username: schema.users.username,
        nickname: schema.users.nickname,
        status: schema.users.status,
        is_admin: schema.users.isAdmin,
        created_at: schema.users.createdAt,
      });

    if (updated.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新用户状态失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
