'use client';

import { useEffect, useState } from 'react';
import { Users, Gamepad2, Trophy, TrendingUp, BarChart3, Star } from 'lucide-react';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  userTotal: number;
  newUsersLast7Days: number;
  recordTotal: number;
  newRecordsLast7Days: number;
  successTotal: number;
  avgScore: number;
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  icon: React.ReactNode;
  title: string;
  description: string;
  format: (v: number) => string;
}[] = [
  { key: 'userTotal', icon: <Users className="h-4 w-4" />, title: '用户总数', description: '所有注册用户数量', format: (v) => String(v) },
  { key: 'newUsersLast7Days', icon: <TrendingUp className="h-4 w-4" />, title: '近7天新增用户', description: '近一周新增注册用户', format: (v) => String(v) },
  { key: 'recordTotal', icon: <Gamepad2 className="h-4 w-4" />, title: '游戏记录总数', description: '所有游戏记录数量', format: (v) => String(v) },
  { key: 'newRecordsLast7Days', icon: <BarChart3 className="h-4 w-4" />, title: '近7天游戏记录', description: '近一周新增游戏记录', format: (v) => String(v) },
  { key: 'successTotal', icon: <Trophy className="h-4 w-4" />, title: '通关总数', description: '成功通关的游戏次数', format: (v) => String(v) },
  { key: 'avgScore', icon: <Star className="h-4 w-4" />, title: '平均好感度', description: '所有游戏记录的平均最终分数', format: (v) => v.toFixed(1) },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async (res) => {
        if (!res.ok) throw new Error(`请求失败: ${res.status}`);
        return res.json();
      })
      .then((data: DashboardStats) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-slate-800">概览</h2>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          加载统计数据失败: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen p-6 rounded-lg">
      <h2 className="mb-6 text-xl font-semibold text-white">概览</h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {STAT_CARDS.map((card) => (
          <li key={card.key} className="list-none min-h-[10rem]">
            <div className="relative h-full rounded-2xl border border-slate-700 p-2">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative z-10 flex h-full flex-col justify-between gap-4 rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-sm">
                <div className="relative flex flex-1 flex-col justify-between gap-3">
                  <div className="w-fit rounded-lg border border-slate-600 bg-slate-800 p-2">
                    {card.icon}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold tracking-tight text-white">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {card.description}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  {loading || !stats ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <span className="text-3xl font-bold text-white">
                      {card.format(stats[card.key])}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
