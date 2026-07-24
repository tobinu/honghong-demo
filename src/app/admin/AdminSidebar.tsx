'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: '概览', href: '/admin' },
  { label: '用户管理', href: '/admin/users' },
  { label: '订单管理', href: '/admin/orders' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-[240px] flex-col bg-slate-900 text-white">
      <div className="flex h-14 items-center px-6">
        <span className="text-base font-bold tracking-wide">管理后台</span>
      </div>
      <ul className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
