import type { GameRecord } from './types';

const STORAGE_KEY = 'honghong_simulator_records';

/** 保存一条游戏记录 */
export function saveGameRecord(record: GameRecord): void {
  const records = getGameRecords();
  records.unshift(record);
  // 最多保存 50 条
  if (records.length > 50) records.length = 50;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }
}

/** 获取所有游戏记录 */
export function getGameRecords(): GameRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 生成唯一 ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/** 获取统计数据 */
export function getGameStats(): {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: string;
  favoriteCharacter: string | null;
} {
  const records = getGameRecords();
  const wins = records.filter((r) => r.result === 'success').length;
  const losses = records.filter((r) => r.result === 'failure').length;

  // 统计最常用角色
  const charCounts: Record<string, number> = {};
  for (const r of records) {
    charCounts[r.characterId] = (charCounts[r.characterId] || 0) + 1;
  }
  const favoriteCharacter =
    Object.entries(charCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalGames: records.length,
    wins,
    losses,
    winRate: records.length > 0 ? `${Math.round((wins / records.length) * 100)}%` : '0%',
    favoriteCharacter,
  };
}
