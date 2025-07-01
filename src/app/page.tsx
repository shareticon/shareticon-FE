'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken, reissueToken } from '@/utils/auth';
import GroupJoinRequestsSection from './profile/GroupJoinRequestsSection';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('=== 인증 확인 시작 ===');
        const currentToken = getAccessToken();
        console.log('현재 토큰 존재 여부:', !!currentToken);
        console.log('현재 토큰 앞 20자:', currentToken?.substring(0, 20) + '...');
        
        if (!currentToken) {
          console.log('토큰이 없어서 재발급 시도...');
          await reissueToken();
          console.log('토큰 재발급 성공');
        } else {
          console.log('기존 토큰 사용');
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        setError(error instanceof Error ? error.message : '인증에 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleRetry = async () => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!getAccessToken()) {
          await reissueToken();
        }
      } catch (error) {
        console.error('인증 확인 실패:', error);
        setError(error instanceof Error ? error.message : '인증에 문제가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    await checkAuth();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        title="홈을 불러올 수 없어요"
        onRetry={handleRetry}
        retryText="다시 시도하기"
        backLink="/login"
        backText="로그인 페이지로"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
          <h1 className="text-2xl font-bold text-indigo-900">나의 기프티콘</h1>
          <p className="text-sm text-gray-600 mt-1">
            소중한 기프티콘을 한눈에 관리하세요
          </p>
        </header>

        <main className="p-4">
          <section className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-indigo-900">찜한 기프티콘</h2>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                  전체보기
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600 border border-gray-100">
                아직 찜한 기프티콘이 없습니다
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-indigo-900">만료 예정 기프티콘</h2>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                  전체보기
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600 border border-gray-100">
                만료 예정인 기프티콘이 없습니다
              </div>
            </div>

            <GroupJoinRequestsSection />
          </section>
        </main>
      </div>
    </div>
  );
}
