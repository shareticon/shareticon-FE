'use client';

import { useEffect, useState } from 'react';
import GroupJoinRequestsSection from './profile/GroupJoinRequestsSection';
import ErrorDisplay from '@/components/ErrorDisplay';
import { NetworkErrorPage } from '@/components/ErrorPages';
import ProtectedRoute from '@/components/ProtectedRoute';
import HorizontalVoucherCards from '@/components/HorizontalVoucherCards';
import { fetchWithToken, getAccessToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import { logger } from '@/utils/logger';

interface Voucher {
  id: number;
  presignedImage: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  name: string;
  expiration: string;
  registeredUserId?: number;
  isWishList?: boolean;
  groupId?: number;
}

interface WishListItem {
  voucherId: number;
  presignedImage: string;
  voucherName: string;
  groupId: number;
  registeredUserId: number;
  expiration: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
}

interface WishListResponse {
  content: WishListItem[];
  size: number;
  hasNext: boolean;
}

function HomeContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 찜한 기프티콘 상태 (실제 API에서 가져올 데이터)
  const [favoriteVouchers, setFavoriteVouchers] = useState<Voucher[]>([]);
  
  // 만료 예정 기프티콘 (추후 API 연동 시 변경 예정)
  const [expiringVouchers] = useState<Voucher[]>([]);

  // 찜한 기프티콘 목록 조회
  const fetchFavoriteVouchers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        pageSize: '10' // 홈에서는 최대 10개까지만 표시
      });

      const response = await fetchWithToken(createApiUrl(`/wishList?${queryParams}`));
      
      if (!response.ok) {
        throw new Error('찜한 기프티콘을 불러오는데 실패했습니다.');
      }

      const data: WishListResponse = await response.json();
      
      // API 응답을 Voucher 형태로 변환
      const convertedVouchers: Voucher[] = data.content.map(item => ({
        id: item.voucherId,
        presignedImage: item.presignedImage,
        status: item.status,
        name: item.voucherName,
        expiration: item.expiration,
        registeredUserId: item.registeredUserId,
        isWishList: true, // 찜 목록에서 가져온 데이터는 모두 찜한 상태
        groupId: item.groupId
      }));
      
      setFavoriteVouchers(convertedVouchers);
      
    } catch (e: unknown) {
      logger.error('찜한 기프티콘 조회 실패:', e);
      
      // 네트워크 에러인지 확인
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        // 백엔드 서버 연결 실패 - 새로운 네트워크 에러 페이지 표시
        setError('NETWORK_ERROR');
      } else {
        // 다른 에러는 무시하고 빈 배열로 설정
        setFavoriteVouchers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 찜한 기프티콘 조회
  useEffect(() => {
    // 토큰이 있을 때만 API 호출 (ProtectedRoute가 인증을 보장)
    const token = getAccessToken();
    if (token) {
      fetchFavoriteVouchers();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-stone-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // 네트워크 에러인 경우 새로운 에러 페이지 사용
    if (error === 'NETWORK_ERROR') {
      return (
        <NetworkErrorPage 
          title="오류가 발생했습니다"
          message="네트워크 상태를 확인하시거나 잠시 후 다시 시도해 주세요"
          onRetry={() => {
            setError(null);
            fetchFavoriteVouchers();
          }}
          onGoHome={() => window.location.reload()}
          showHome={true}
        />
      );
    }
    
    // 다른 에러는 기존 ErrorDisplay 사용
    return (
      <ErrorDisplay 
        error={error}
        title="홈을 불러올 수 없어요"
        onRetry={() => setError(null)}
        retryText="다시 시도하기"
        backLink="/login"
        backText="로그인 페이지로"
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 z-10 p-4 backdrop-blur-sm bg-[#fffef9]/80">
          <h1 className="text-2xl font-bold text-amber-900">나의 기프티콘</h1>
          <p className="text-sm text-stone-600 mt-1">
            소중한 기프티콘을 한눈에 관리하세요
          </p>
        </header>

        <main className="p-4">
          <section className="space-y-4">
            <HorizontalVoucherCards
              vouchers={favoriteVouchers}
              title="찜한 기프티콘"  
              emptyMessage="아직 찜한 기프티콘이 없습니다"
              onRefresh={fetchFavoriteVouchers}
            />

            <HorizontalVoucherCards
              vouchers={expiringVouchers}
              title="만료 예정 기프티콘"
              emptyMessage="만료 예정인 기프티콘이 없습니다"
              onRefresh={fetchFavoriteVouchers}
            />

            <GroupJoinRequestsSection />
          </section>
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute redirectToLogin={true}>
      <HomeContent />
    </ProtectedRoute>
  );
}
