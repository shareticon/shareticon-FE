'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, reissueToken } from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        
        const token = getAccessToken();
        
        if (!token) {
          // 토큰이 없으면 reissue 시도
          try {
            await reissueToken();
            setIsAuthenticated(true);
          } catch {
            console.log('토큰 재발급 실패, 로그인 페이지로 이동');
            // reissue에서 이미 토큰 정리와 리다이렉트를 수행하므로 여기서는 state만 설정
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        setIsAuthenticated(false);
        // 로그인 페이지로 리다이렉트
        router.replace('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // 인증 확인 중이거나 인증 상태가 확인되지 않았으면 로딩 화면
  if (isCheckingAuth || isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
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