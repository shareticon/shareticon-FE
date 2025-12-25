'use client';

import { useEffect, useState } from 'react';
import { getAccessToken, reissueToken } from '@/utils/auth';
import { AuthErrorPage, NetworkErrorPage } from './ErrorPages';
import { useRouter } from 'next/navigation';
import { logger } from '@/utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectToLogin?: boolean; // true면 인증 실패 시 /login으로 리다이렉트
}

// 네트워크 에러인지 확인하는 헬퍼 함수
const isNetworkError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const errorName = (error as { name?: string })?.name || '';
  
  return (
    message.includes('Failed to fetch') ||
    message.includes('fetch') ||
    message.includes('NetworkError') ||
    message.includes('ERR_NETWORK') ||
    message.includes('ERR_CONNECTION') ||
    message.includes('ENOTFOUND') ||
    errorName === 'TypeError' ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  );
};

export default function ProtectedRoute({ children, fallback, redirectToLogin = false }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [errorType, setErrorType] = useState<'network' | 'auth' | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        setErrorType(null);
        
        const token = getAccessToken();
        
        if (token) {
          // 토큰이 있으면 인증됨
          setIsAuthenticated(true);
          return;
        }
        
        // 토큰이 없으면 reissue 시도 (쿠키에 refreshToken이 있을 수 있음)
        try {
          await reissueToken();
          setIsAuthenticated(true);
        } catch (error: unknown) {
          // 에러 타입에 따라 구분
          if (isNetworkError(error)) {
            // 백엔드 연결 실패 → 네트워크 에러 화면
            setErrorType('network');
          } else {
            // 인증 실패 (401, 403 등)
            if (redirectToLogin) {
              // redirectToLogin이 true면 조용히 /login으로 리다이렉트
              router.push('/login');
              return;
            } else {
              // false면 로그인 필요 화면 표시
              setErrorType('auth');
            }
          }
          setIsAuthenticated(false);
        }
      } catch (error: unknown) {
        logger.error('인증 확인 실패:', error);
        
        if (isNetworkError(error)) {
          setErrorType('network');
        } else {
          setErrorType('auth');
        }
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // 네트워크 에러 (백엔드 문제)
  if (errorType === 'network') {
    return (
      <NetworkErrorPage 
        title="서버에 연결할 수 없어요"
        message="네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요."
        onRetry={() => window.location.reload()}
        onGoHome={() => router.push('/')}
        showHome={false}
      />
    );
  }

  // 로그인 필요 (인증 문제)
  if (errorType === 'auth') {
    return <AuthErrorPage />;
  }

  // 인증 확인 중
  if (isCheckingAuth || isAuthenticated === null) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return <AuthErrorPage />;
  }

  // 인증된 경우에만 자식 컴포넌트 렌더링
  return <>{children}</>;
} 