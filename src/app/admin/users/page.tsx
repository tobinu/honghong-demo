'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface UserItem {
  id: number;
  username: string;
  nickname: string | null;
  status: string;
  isAdmin: boolean;
  createdAt: string;
}

interface UsersResponse {
  users: UserItem[];
  total: number;
}

type UserStatus = 'active' | 'inactive' | 'banned';

const STATUS_LABEL: Record<UserStatus, string> = {
  active: '正常',
  inactive: '未激活',
  banned: '已封禁',
};

const STATUS_BADGE_CLASS: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  banned: 'bg-red-100 text-red-700 border-red-200',
};

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 编辑弹窗状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [updating, setUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('pageSize', String(PAGE_SIZE));

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(errData.error || '请求失败');
      }
      const data: UsersResponse = await res.json();
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const openEditDialog = (user: UserItem) => {
    setEditingUser(user);
    setNewStatus(user.status as UserStatus);
    setEditDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editingUser.id, status: newStatus }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '更新失败' }));
        throw new Error(errData.error || '更新失败');
      }
      setEditDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-purple-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">用户管理</h1>

        {/* 搜索和筛选区域 */}
        <div className="flex items-center gap-3 mb-6">
          <Input
            placeholder="搜索用户名或昵称"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[240px]"
          />
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
              <SelectItem value="banned">已封禁</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        {/* 错误态 */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* 用户列表表格 */}
        <div className="rounded-lg border bg-white/80 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>管理员</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : users.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                          暂无用户数据
                        </TableCell>
                      </TableRow>
                    )
                  : users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.nickname || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={STATUS_BADGE_CLASS[user.status as UserStatus]}
                          >
                            {STATUS_LABEL[user.status as UserStatus] || user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.isAdmin ? '是' : '否'}</TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            编辑状态
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">
              共 {total} 条，第 {page}/{totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        )}

        {/* 编辑状态弹窗 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户状态</DialogTitle>
              <DialogDescription>
                当前用户：{editingUser?.username}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as UserStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                  <SelectItem value="banned">已封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={updating}>取消</Button>
              </DialogClose>
              <Button onClick={handleUpdateStatus} disabled={updating}>
                {updating ? '更新中...' : '确认'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
