import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. 校验登录状态
  const user = await getCurrentUser();
  if (!user) redirect('/');

  // 2. 校验管理员权限
  const db = getDb();
  const dbUsers = await db
    .select({ isAdmin: schema.users.isAdmin })
    .from(schema.users)
    .where(eq(schema.users.id, user.userId))
    .limit(1);

  if (dbUsers.length === 0 || !dbUsers[0].isAdmin) redirect('/');

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b bg-white px-6">
          <h1 className="text-lg font-semibold text-slate-800">
            哄哄模拟器 · 管理后台
          </h1>
        </header>
        <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
