'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ========== 类型定义 ==========

interface OrderRecord {
  id: number;
  userId: number;
  username: string;
  characterId: string;
  characterName: string;
  scenarioId: string;
  scenarioTitle: string;
  roundsPlayed: number;
  finalScore: number;
  result: 'success' | 'failure';
  playedAt: string;
}

interface OrdersResponse {
  orders: OrderRecord[];
  total: number;
  page: number;
  pageSize: number;
}

// ========== 常量 ==========

const CHARACTER_OPTIONS = [
  { id: 'tsundere', label: '小雪（傲娇）' },
  { id: 'gentle', label: '小柔（温柔）' },
  { id: 'cool', label: '小霜（冷艳）' },
] as const;

const PAGE_SIZE = 10;

// ========== 工具函数 ==========

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

// ========== 页面组件 ==========

export default function AdminOrdersPage() {
  // 搜索与筛选
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [characterFilter, setCharacterFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  // 数据
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 详情弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<OrderRecord | null>(null);

  // 编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [newResult, setNewResult] = useState<string>('success');
  const [updating, setUpdating] = useState(false);

  // ========== 数据获取 ==========

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      if (search) params.set('search', search);
      if (resultFilter !== 'all') params.set('result', resultFilter);
      if (characterFilter !== 'all') params.set('characterId', characterFilter);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: '请求失败' }));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }
      const data: OrdersResponse = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [page, search, resultFilter, characterFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ========== 操作 ==========

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleViewDetail = (order: OrderRecord) => {
    setDetailOrder(order);
    setDetailDialogOpen(true);
  };

  const handleOpenEdit = (order: OrderRecord) => {
    setEditingOrder(order);
    setNewResult(order.result);
    setEditDialogOpen(true);
  };

  const handleUpdateResult = async () => {
    if (!editingOrder) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingOrder.id, result: newResult }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: '更新失败' }));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }
      setEditDialogOpen(false);
      await fetchOrders();
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新状态失败');
    } finally {
      setUpdating(false);
    }
  };

  // ========== 分页 ==========

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // ========== 渲染 ==========

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面标题 */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">订单管理（游戏记录）</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 搜索与筛选 */}
        <div className="flex items-center gap-3 mb-6 bg-white rounded-lg border p-4">
          <Input
            placeholder="搜索用户名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[200px]"
          />
          <Select value={resultFilter} onValueChange={setResultFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="结果筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="success">success</SelectItem>
              <SelectItem value="failure">failure</SelectItem>
            </SelectContent>
          </Select>
          <Select value={characterFilter} onValueChange={setCharacterFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="角色筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {CHARACTER_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        {/* 错误态 */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 加载态 */}
        {loading ? (
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-3 border-b">
              <Skeleton className="h-5 w-[120px]" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-3 border-b last:border-b-0 flex items-center gap-4">
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[50px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[40px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          /* 空状态 */
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="text-5xl mb-3">🎮</div>
            <p className="text-gray-500 text-sm">暂无游戏记录</p>
          </div>
        ) : (
          /* 数据表格 */
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>场景</TableHead>
                  <TableHead>好感度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>轮数</TableHead>
                  <TableHead>游戏时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.username}</TableCell>
                    <TableCell>{order.characterName}</TableCell>
                    <TableCell>{order.scenarioTitle}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{order.finalScore}</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              order.finalScore >= 60
                                ? 'bg-green-500'
                                : order.finalScore >= 30
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(Math.max(order.finalScore, 0), 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.result === 'success' ? (
                        <Badge className="bg-green-500 text-white border-transparent hover:bg-green-500/90">
                          通关
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white border-transparent hover:bg-red-500/90">
                          失败
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{order.roundsPlayed}</TableCell>
                    <TableCell>{formatDate(order.playedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(order)}
                        >
                          查看详情
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(order)}
                        >
                          编辑状态
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 分页 */}
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========== 详情弹窗 ========== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>查看游戏记录的详细信息</DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-3 py-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">订单号</span>
                <span className="font-medium">{detailOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">用户名</span>
                <span className="font-medium">{detailOrder.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">角色</span>
                <span className="font-medium">{detailOrder.characterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">场景</span>
                <span className="font-medium">{detailOrder.scenarioTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">好感度</span>
                <span className="font-medium">{detailOrder.finalScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">状态</span>
                {detailOrder.result === 'success' ? (
                  <Badge className="bg-green-500 text-white border-transparent">通关</Badge>
                ) : (
                  <Badge className="bg-red-500 text-white border-transparent">失败</Badge>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">轮数</span>
                <span className="font-medium">{detailOrder.roundsPlayed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">游戏时间</span>
                <span className="font-medium">{formatDate(detailOrder.playedAt)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== 编辑状态弹窗 ========== */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑订单状态</DialogTitle>
            <DialogDescription>修改游戏记录的结果状态</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">订单号</span>
                <span className="font-medium">{editingOrder.id}</span>
              </div>
              <div>
                <span className="text-gray-500 text-sm block mb-2">选择新状态</span>
                <Select value={newResult} onValueChange={setNewResult}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择结果" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">success（通关）</SelectItem>
                    <SelectItem value="failure">failure（失败）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={updating}>
              取消
            </Button>
            <Button onClick={handleUpdateResult} disabled={updating}>
              {updating ? '更新中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
