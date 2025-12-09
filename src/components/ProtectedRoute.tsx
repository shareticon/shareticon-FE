'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, reissueToken } from '@/utils/auth';
import { NetworkErrorPage } from './ErrorPages';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);
        setAuthError(null);
        
        const token = getAccessToken();
        
        if (!token) {
          // 토큰이 없으면 reissue 시도
          try {
            await reissueToken();
            setIsAuthenticated(true);
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.log('reissueToken 에러:', message);
            
            // 백엔드가 꺼져있는 경우를 대비해 일단 모든 reissue 에러를 네트워크 에러로 처리
            // (나중에 백엔드가 켜져있을 때 실제 인증 에러와 구분할 수 있도록 개선 가능)
            setAuthError('network');
          }
        } else {
          setIsAuthenticated(true);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const errorName = (error as { name?: string })?.name || '';
        console.error('인증 확인 실패:', message);
        
        // 네트워크 에러인지 확인 (더 포괄적으로)
        const errorString = message || '';
        const isNetworkError = 
          errorString.includes('fetch') || 
          errorString.includes('network') || 
          errorString.includes('ENOTFOUND') ||
          errorString.includes('Failed to fetch') ||
          errorString.includes('NetworkError') ||
          errorString.includes('ERR_NETWORK') ||
          errorString.includes('ERR_INTERNET_DISCONNECTED') ||
          errorName === 'TypeError' ||
          (typeof navigator !== 'undefined' && !navigator.onLine);
        
        if (isNetworkError) {
          setAuthError('network');
        } else {
          setIsAuthenticated(false);
          router.replace('/login');
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // 네트워크 에러 발생 시
  if (authError === 'network') {
    return (
      <NetworkErrorPage 
        title="오류가 발생했습니다"
        message="네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요"
        onRetry={() => window.location.reload()}
        onGoHome={() => router.push('/login')}
        showHome={true}
      />
    );
  }

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

  // 인증되지 않았으면 로딩 화면 표시 (리다이렉션 중)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  // 인증된 경우에만 자식 컴포넌트 렌더링
  return <>{children}</>;
} 