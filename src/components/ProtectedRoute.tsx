'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getAccessToken();
      
      if (!token) {
        // 토큰이 없으면 즉시 로그인 페이지로 리다이렉션
        router.replace('/login');
        return;
      }
      
      // 토큰이 있으면 인증된 상태로 설정
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  // 인증 상태가 확인되지 않았으면 로딩 화면 또는 fallback 표시
  if (isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않았으면 아무것도 렌더링하지 않음 (리다이렉션 중)
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 경우에만 자식 컴포넌트 렌더링
  return <>{children}</>;
} 