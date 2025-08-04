'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAccessToken } from '@/utils/auth';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // URL에서 토큰을 추출 (백엔드에서 쿼리 파라미터나 해시로 전달할 수 있음)
        const token = searchParams.get('token');
        
        if (token) {
    
          setAccessToken(token);
          router.replace('/');
        } else {
          // 토큰이 없으면 에러 처리
          console.error('토큰이 없습니다.');
          router.replace('/login?error=no_token');
        }
      } catch (error) {
        console.error('로그인 콜백 처리 에러:', error);
        router.replace('/login?error=callback_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
} 