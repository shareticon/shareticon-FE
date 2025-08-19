'use client';

import { useEffect, useState } from 'react';
import GroupJoinRequestsSection from './profile/GroupJoinRequestsSection';
import ErrorDisplay from '@/components/ErrorDisplay';
import ProtectedRoute from '@/components/ProtectedRoute';
import HorizontalVoucherCards from '@/components/HorizontalVoucherCards';
import { fetchWithToken } from '@/utils/auth';
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
      // 에러가 발생해도 홈 화면은 정상적으로 표시하되, 찜한 기프티콘만 빈 배열로 설정
      setFavoriteVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 찜한 기프티콘 조회
  useEffect(() => {
    fetchFavoriteVouchers();
  }, []);

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
        onRetry={() => setError(null)}
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
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
