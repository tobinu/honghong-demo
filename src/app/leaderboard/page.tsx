'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  bestScore: number;
  achievedAt: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // 读取当前登录用户
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setCurrentUserId(user.userId);
      }
    } catch {}

    // 加载排行榜
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data.leaderboard || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-purple-100">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-800">排行榜</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* 说明 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏆</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            好感度排行榜
          </h2>
          <p className="text-gray-400 text-sm mt-1">登录玩家的最高分数排名</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-12">
            <div className="w-8 h-8 border-2 border-pink-300 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 mt-3 text-sm">加载中...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-gray-500">暂无记录</p>
            <p className="text-gray-400 text-sm mt-1">完成一局游戏即可上榜</p>
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              开始游戏
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => {
              const isMe = entry.userId === currentUserId;
              const badge = getRankBadge(entry.rank);

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isMe
                      ? 'bg-gradient-to-r from-pink-100 to-purple-100 ring-2 ring-pink-300 shadow-sm'
                      : 'bg-white/70'
                  }`}
                >
                  {/* 排名 */}
                  <div className="w-8 text-center flex-shrink-0">
                    {badge ? (
                      <span className="text-xl">{badge}</span>
                    ) : (
                      <span className="text-gray-400 font-medium text-sm">{entry.rank}</span>
                    )}
                  </div>

                  {/* 用户信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium truncate ${isMe ? 'text-pink-600' : 'text-gray-800'}`}>
                        {entry.username}
                      </span>
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-pink-500 text-white font-medium flex-shrink-0">
                          我
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.achievedAt)}</p>
                  </div>

                  {/* 分数 */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`font-bold ${isMe ? 'text-pink-500' : 'text-purple-500'}`}>
                      {entry.bestScore}
                    </div>
                    <div className="text-[10px] text-gray-400">最高分</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 底部 */}
        {!loading && leaderboard.length > 0 && (
          <div className="text-center mt-8">
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              返回首页
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
