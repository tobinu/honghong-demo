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
    const result = searchParams.get("result") || "";
    const characterId = searchParams.get("character_id") || "";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(100, Number(searchParams.get("pageSize") || "20")));

    const conditions: (SQL | undefined)[] = [];

    if (search) {
      conditions.push(ilike(schema.users.username, `%${search}%`));
    }

    if (result) {
      conditions.push(eq(schema.gameRecords.result, result));
    }

    if (characterId) {
      conditions.push(eq(schema.gameRecords.characterId, characterId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(schema.gameRecords)
      .leftJoin(schema.users, eq(schema.gameRecords.userId, schema.users.id))
      .leftJoin(schema.characters, eq(schema.gameRecords.characterId, schema.characters.id))
      .leftJoin(schema.scenarios, eq(schema.gameRecords.scenarioId, schema.scenarios.id))
      .where(whereClause);

    const data = await db
      .select({
        id: schema.gameRecords.id,
        user_id: schema.gameRecords.userId,
        username: schema.users.username,
        character_id: schema.gameRecords.characterId,
        character_name: schema.characters.name,
        scenario_id: schema.gameRecords.scenarioId,
        scenario_title: schema.scenarios.title,
        rounds_played: schema.gameRecords.roundsPlayed,
        final_score: schema.gameRecords.finalScore,
        result: schema.gameRecords.result,
        played_at: schema.gameRecords.playedAt,
      })
      .from(schema.gameRecords)
      .leftJoin(schema.users, eq(schema.gameRecords.userId, schema.users.id))
      .leftJoin(schema.characters, eq(schema.gameRecords.characterId, schema.characters.id))
      .leftJoin(schema.scenarios, eq(schema.gameRecords.scenarioId, schema.scenarios.id))
      .where(whereClause)
      .orderBy(desc(schema.gameRecords.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return NextResponse.json({ total: totalResult.total, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询游戏记录失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (!adminCheck.ok) return adminCheck.error!;

    const db = getDb();
    const body = await request.json() as { recordId: number; result: string };

    const { recordId, result } = body;

    if (!recordId || !result) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const allowedResults = ["success", "failure"];
    if (!allowedResults.includes(result)) {
      return NextResponse.json({ error: "result 值不合法，只允许 success/failure" }, { status: 400 });
    }

    const updated = await db
      .update(schema.gameRecords)
      .set({ result })
      .where(eq(schema.gameRecords.id, recordId))
      .returning({
        id: schema.gameRecords.id,
        result: schema.gameRecords.result,
      });

    if (updated.length === 0) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: updated[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "更新游戏记录失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
