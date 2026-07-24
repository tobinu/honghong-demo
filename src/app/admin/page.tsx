'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalUsers: number;
  newUsers7d: number;
  totalGameRecords: number;
  newGameRecords7d: number;
  totalSuccess: number;
  avgScore: number;
}

const STAT_CARDS: {
  key: keyof DashboardStats;
  title: string;
  description: string;
}[] = [
  { key: 'totalUsers', title: '用户总数', description: '所有注册用户数量' },
  { key: 'newUsers7d', title: '最近7天新增用户', description: '近一周新增注册用户' },
  { key: 'totalGameRecords', title: '游戏记录总数', description: '所有游戏记录数量' },
  { key: 'newGameRecords7d', title: '最近7天游戏记录数', description: '近一周新增游戏记录' },
  { key: 'totalSuccess', title: '通关总数', description: '成功通关的游戏次数' },
  { key: 'avgScore', title: '平均好感度', description: '所有游戏记录的平均最终分数' },
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

  if (loading) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-slate-800">概览</h2>
        <div className="grid grid-cols-3 gap-4">
          {STAT_CARDS.map((card) => (
            <Card key={card.key}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

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

  if (!stats) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold text-slate-800">概览</h2>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          暂无统计数据
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold text-slate-800">概览</h2>
      <div className="grid grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.key}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-slate-900">
                {card.key === 'avgScore'
                  ? stats[card.key].toFixed(1)
                  : stats[card.key]}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
