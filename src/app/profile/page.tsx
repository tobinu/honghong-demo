'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

interface UserInfo {
  userId: number;
  username: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 读取用户信息
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {}

    // 从 API 加载游戏记录
    async function fetchRecords() {
      try {
        const headers: Record<string, string> = {};
        const token = localStorage.getItem("auth_token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch('/api/game-records', { headers });
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  const totalGames = records.length;
  const wins = records.filter(r => r.result === 'win').length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const avgScore = totalGames > 0 ? Math.round(records.reduce((sum, r) => sum + r.final_score, 0) / totalGames) : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看你的游戏记录</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* 顶部导航 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="text-lg font-bold text-gray-700">个人中心</h1>
      </div>

      {/* 用户信息卡片 */}
      <div className="px-4 pt-6 pb-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{user.username}</h2>
              <p className="text-sm text-gray-400">哄哄模拟器玩家</p>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="text-center p-3 bg-pink-50 rounded-xl">
              <div className="text-2xl font-bold text-pink-600">{totalGames}</div>
              <div className="text-xs text-gray-500 mt-0.5">总场次</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{winRate}%</div>
              <div className="text-xs text-gray-500 mt-0.5">胜率</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{avgScore}</div>
              <div className="text-xs text-gray-500 mt-0.5">平均分</div>
            </div>
          </div>
        </div>
      </div>

      {/* 游戏记录列表 */}
      <div className="px-4 pb-8">
        <h3 className="text-base font-bold text-gray-700 mb-3 px-1">游戏记录</h3>

        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-400">还没有游戏记录</p>
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors"
            >
              开始游戏
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-pink-50 flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  record.result === 'win'
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}>
                  {record.result === 'win' ? '💕' : '💔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm truncate">{record.scenario}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      record.result === 'win'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-500'
                    }`}>
                      {record.result === 'win' ? '通关' : '失败'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>好感度 {record.final_score}</span>
                    <span>{new Date(record.played_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
