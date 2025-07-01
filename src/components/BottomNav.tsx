'use client';

import { HomeIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '홈', href: '/', icon: HomeIcon },
    { name: '그룹', href: '/groups', icon: UserGroupIcon },
    { name: '프로필', href: '/profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full
                ${isActive ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <span className="relative inline-block">
                <item.icon className="w-6 h-6" />
              </span>
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 