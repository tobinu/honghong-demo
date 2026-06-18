import { NextResponse } from 'next/server';
import { desc, inArray } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const allRecords = await db
      .select({
        userId: schema.gameRecords.userId,
        finalScore: schema.gameRecords.finalScore,
        playedAt: schema.gameRecords.playedAt,
      })
      .from(schema.gameRecords)
      .orderBy(desc(schema.gameRecords.finalScore))
      .limit(200);

    const seenUsers = new Set<number>();
    const userIds: number[] = [];
    const leaderboard: {
      rank: number;
      userId: number;
      username: string;
      bestScore: number;
      achievedAt: string;
    }[] = [];

    for (const rec of allRecords) {
      if (seenUsers.has(rec.userId)) continue;
      seenUsers.add(rec.userId);
      userIds.push(rec.userId);

      leaderboard.push({
        rank: leaderboard.length + 1,
        userId: rec.userId,
        username: '',
        bestScore: rec.finalScore,
        achievedAt: rec.playedAt,
      });

      if (leaderboard.length >= 20) break;
    }

    if (userIds.length > 0) {
      const users = await db
        .select({ id: schema.users.id, username: schema.users.username })
        .from(schema.users)
        .where(inArray(schema.users.id, userIds));

      const userMap = new Map<number, string>();
      for (const u of users) {
        userMap.set(u.id, u.username);
      }

      for (const entry of leaderboard) {
        entry.username = userMap.get(entry.userId) || '未知用户';
      }
    }

    return NextResponse.json({ leaderboard });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取排行榜失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
