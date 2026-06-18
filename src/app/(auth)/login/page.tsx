'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: 'include',
      });
      const data = await res.json();
      console.log('[login] status:', res.status, 'data:', JSON.stringify(data));

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      // Save user info and token to localStorage for instant UI update and API auth
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('auth_token', data.token);
      // Delay redirect to ensure localStorage writes are persisted before page unload
      setTimeout(() => { window.location.href = '/'; }, 300);
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💕</div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500 text-sm mt-1">登录哄哄模拟器，继续练习哄人技巧</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入你的用户名"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-gray-800 placeholder:text-gray-400"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all text-gray-800 placeholder:text-gray-400"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-medium rounded-xl transition-colors"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          还没有账号？
          <Link href="/register" className="text-pink-500 hover:text-pink-600 font-medium ml-1">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}
