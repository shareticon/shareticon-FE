'use client';

import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';

export default function ConditionalBottomNav() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return null;
  }

  return <BottomNav />;
}
