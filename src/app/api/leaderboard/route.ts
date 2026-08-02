import { NextResponse } from 'next/server';
import { sql, desc } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const topUsers = await db
      .select({
        userId: schema.gameRecords.userId,
        bestScore: sql<number>`MAX(${schema.gameRecords.finalScore})`.as('best_score'),
      })
      .from(schema.gameRecords)
      .groupBy(schema.gameRecords.userId)
      .orderBy(desc(sql`best_score`))
      .limit(20);

    if (topUsers.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    const userIds = topUsers.map((r) => r.userId);
    const users = await db
      .select({ id: schema.users.id, username: schema.users.username })
      .from(schema.users)
      .where(sql`${schema.users.id} IN ${userIds}`);

    const userMap = new Map<number, string>();
    for (const u of users) {
      userMap.set(u.id, u.username);
    }

    const bestScoreRows = await db
      .select({
        userId: schema.gameRecords.userId,
        playedAt: schema.gameRecords.playedAt,
      })
      .from(schema.gameRecords)
      .where(sql`${schema.gameRecords.userId} IN ${userIds}`)
      .orderBy(desc(schema.gameRecords.finalScore), desc(schema.gameRecords.playedAt));

    const bestScoreAtMap = new Map<number, string>();
    for (const row of bestScoreRows) {
      if (!bestScoreAtMap.has(row.userId)) {
        bestScoreAtMap.set(row.userId, row.playedAt.toISOString());
      }
    }

    const leaderboard = topUsers.map((rec, idx) => ({
      rank: idx + 1,
      userId: rec.userId,
      username: userMap.get(rec.userId) || '未知用户',
      bestScore: rec.bestScore,
      achievedAt: bestScoreAtMap.get(rec.userId) || new Date().toISOString(),
    }));

    return NextResponse.json({ leaderboard });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取排行榜失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
