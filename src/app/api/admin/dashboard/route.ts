import { NextRequest, NextResponse } from "next/server";
import { eq, count, sql } from "drizzle-orm";
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

    const sevenDaysAgo = sql`NOW() - INTERVAL '7 days'`;

    const [userTotalResult] = await db
      .select({ total: count() })
      .from(schema.users);

    const [newUsersResult] = await db
      .select({ total: count() })
      .from(schema.users)
      .where(sql`${schema.users.createdAt} > ${sevenDaysAgo}`);

    const [recordTotalResult] = await db
      .select({ total: count() })
      .from(schema.gameRecords);

    const [newRecordsResult] = await db
      .select({ total: count() })
      .from(schema.gameRecords)
      .where(sql`${schema.gameRecords.playedAt} > ${sevenDaysAgo}`);

    const [successResult] = await db
      .select({ total: count() })
      .from(schema.gameRecords)
      .where(sql`${schema.gameRecords.result} = 'success'`);

    const [failureResult] = await db
      .select({ total: count() })
      .from(schema.gameRecords)
      .where(sql`${schema.gameRecords.result} = 'failure'`);

    const [avgScoreResult] = await db
      .select({ avg: sql<number>`COALESCE(AVG(${schema.gameRecords.finalScore}), 0)` })
      .from(schema.gameRecords);

    return NextResponse.json({
      userTotal: userTotalResult.total,
      newUsersLast7Days: newUsersResult.total,
      recordTotal: recordTotalResult.total,
      newRecordsLast7Days: newRecordsResult.total,
      successTotal: successResult.total,
      failureTotal: failureResult.total,
      avgScore: Math.round(avgScoreResult.avg * 100) / 100,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "获取统计数据失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
