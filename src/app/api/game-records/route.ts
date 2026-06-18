import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { scenario, finalScore, result } = body as {
      scenario: string;
      finalScore: number;
      result: string;
    };

    if (!scenario || finalScore === undefined || !result) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const db = getDb();
    const inserted = await db
      .insert(schema.gameRecords)
      .values({
        userId: payload.userId,
        scenario,
        finalScore,
        result,
      })
      .returning();

    if (inserted.length === 0) {
      throw new Error("保存游戏记录失败");
    }

    const record = {
      id: inserted[0].id,
      user_id: inserted[0].userId,
      scenario: inserted[0].scenario,
      final_score: inserted[0].finalScore,
      result: inserted[0].result,
      played_at: inserted[0].playedAt,
    };

    return NextResponse.json({ record, message: "游戏记录已保存" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "保存失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getCurrentUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const db = getDb();
    const records = await db
      .select({
        id: schema.gameRecords.id,
        scenario: schema.gameRecords.scenario,
        final_score: schema.gameRecords.finalScore,
        result: schema.gameRecords.result,
        played_at: schema.gameRecords.playedAt,
      })
      .from(schema.gameRecords)
      .where(eq(schema.gameRecords.userId, payload.userId))
      .orderBy(desc(schema.gameRecords.playedAt));

    return NextResponse.json({ records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "查询失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
