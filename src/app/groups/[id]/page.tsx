'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { VoucherList } from '@/components/VoucherList';
import { AddVoucherModal } from '@/components/AddVoucherModal';
import { ArrowLeftIcon, UserPlusIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import InviteModal from '@/components/InviteModal';
import ErrorDisplay from '@/components/ErrorDisplay';
import { fetchWithToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Voucher {
  id: number;
  presignedImage: string;
  name: string;
  expiration: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
}

interface GroupVouchers {
  groupId: number;
  groupTitle: string;
  groupInviteCode: string;
  vouchers: Voucher[];
}

interface PageableSort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: PageableSort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

interface VoucherResponse {
  content: GroupVouchers[];
  pageable: Pageable;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  sort: PageableSort;
  numberOfElements: number;
  empty: boolean;
}

function GroupDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursorId, setCursorId] = useState<number | null>(null);
  const [groupTitle, setGroupTitle] = useState<string>('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const pageSize = 10;

  const fetchVouchers = async (cursor: number | null = null) => {
    try {
      const token = localStorage.getItem('accessToken');

      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString(),
        ...(cursor && { cursorId: cursor.toString() })
      });

      const apiUrl = createApiUrl(`/vouchers/${params.id}?${queryParams}`);
      console.log('API 요청 URL:', apiUrl);
      console.log('Authorization 토큰:', token);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API 응답 상태:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('API 에러 응답:', errorData);
        
        throw new Error(
          `기프티콘 목록을 불러오는데 실패했습니다. (상태 코드: ${response.status})`
        );
      }

      const data: VoucherResponse = await response.json();
      console.log('API 응답 데이터:', data);
      
      if (data.content.length > 0) {
        const groupData = data.content[0];
        const processedVouchers = groupData.vouchers.map(voucher => ({
          ...voucher,
          presignedImage: voucher.presignedImage
        }));

        if (cursor === null) {
          // 첫 로딩
          setVouchers(processedVouchers);
          setGroupTitle(groupData.groupTitle);
          setInviteCode(groupData.groupInviteCode);
        } else {
          // 추가 로딩
          setVouchers(prev => [...prev, ...processedVouchers]);
        }
        
        setHasMore(!data.last);
        if (groupData.vouchers.length > 0) {
          setCursorId(groupData.vouchers[groupData.vouchers.length - 1].id);
        }
      }
    } catch (error) {
      console.error('기프티콘 목록 조회 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore && cursorId) {
      fetchVouchers(cursorId);
    }
  };

  const handleAddVoucher = async (formData: FormData) => {
    try {
      const token = localStorage.getItem('accessToken');

      // formData에서 필요한 값 추출
      const image = formData.get('image');
      const name = formData.get('name');
      const expiryDate = formData.get('expiryDate');
      const groupId = Number(params.id);

      // 새로운 FormData 생성
      const newFormData = new FormData();
      if (image) newFormData.append('image', image);
      newFormData.append(
        'request',
        JSON.stringify({
          groupId,
          voucherName: name,
          expiration: expiryDate,
        })
      );

      const apiUrl = createApiUrl(`/vouchers`);
      console.log('기프티콘 추가 요청 URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
        body: newFormData,
      });

      console.log('기프티콘 추가 응답 상태:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('기프티콘 추가 에러 응답:', errorData);
        
        throw new Error(
          `기프티콘 추가에 실패했습니다. (상태 코드: ${response.status})`
        );
      }

      // 성공 시 목록 새로고침
      await fetchVouchers();
    } catch (error) {
      console.error('기프티콘 추가 실패:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [params.id]);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('=== 프로필 API 호출 시작 ===');
        console.log('토큰 존재 여부:', !!token);
        
        if (!token) {
          console.log('토큰이 없어서 프로필 API 호출 중단');
          return;
        }
        
        const response = await fetchWithToken(createApiUrl('/profile'));
        
        console.log('프로필 API 응답 상태:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log('=== 프로필 API 응답 ===', userData);
          const userId = userData.userId || userData.id || userData.memberId;
          console.log('추출된 사용자 ID:', userId);
          setCurrentUserId(userId);
        } else {
          console.error('프로필 API 응답 에러:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('에러 내용:', errorText);
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">기프티콘 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        title="그룹을 불러올 수 없어요"
        onRetry={() => fetchVouchers()}
        retryText="다시 불러오기"
        backLink="/groups"
        backText="그룹 목록으로 돌아가기"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <Link href="/groups" className="mr-3 shrink-0 text-gray-600 hover:text-indigo-600 transition-colors">
                <ArrowLeftIcon className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-indigo-900">{groupTitle}</h1>
                <p className="text-sm text-gray-600 mt-1">함께 사용하는 기프티콘</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 md:px-3 md:py-2 transition-colors"
                title="멤버 초대"
              >
                <UserPlusIcon className="w-6 h-6" />
                <span className="hidden md:inline ml-1">멤버 초대</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 md:px-3 md:py-2 transition-colors"
                title="기프티콘 추가"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden md:inline ml-1">기프티콘 추가</span>
              </button>
            </div>
          </div>
        </header>
        
        <VoucherList 
          vouchers={vouchers}
          onLoadMore={loadMore}
          hasMore={hasMore}
          isLoading={isLoading}
          groupId={Number(params.id)}
          onReload={fetchVouchers}
          currentUserId={currentUserId || undefined}
        />

        <AddVoucherModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddVoucher}
        />

        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupName={groupTitle}
          inviteCode={inviteCode}
        />
      </div>
    </div>
  );
}

export default function GroupDetailPage() {
  return (
    <ProtectedRoute>
      <GroupDetailPageContent />
    </ProtectedRoute>
  );
} 