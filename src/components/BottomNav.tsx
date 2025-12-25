'use client';

import { HomeIcon, UserGroupIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, UserGroupIcon as UserGroupIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '홈', href: '/', icon: HomeIcon, iconSolid: HomeIconSolid },
    { name: '그룹', href: '/groups', icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
    { name: '프로필', href: '/profile', icon: UserIcon, iconSolid: UserIconSolid },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-amber-200/50 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = isActive ? item.iconSolid : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-colors
                ${isActive ? 'text-amber-600' : 'text-gray-400 hover:text-amber-500'}`}
            >
              <span className="relative inline-block">
                <Icon className="w-6 h-6" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 rounded-full" />
                )}
              </span>
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-amber-700' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 