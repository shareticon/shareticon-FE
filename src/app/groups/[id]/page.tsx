'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { VoucherList } from '@/components/VoucherList';
import { AddVoucherModal } from '@/components/AddVoucherModal';
import { ArrowLeftIcon, UserPlusIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import InviteModal from '@/components/InviteModal';
import ErrorDisplay from '@/components/ErrorDisplay';
import { fetchWithToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import { VoucherFilterCondition, createDefaultFilterCondition } from '@/types/voucher';

import { logger } from '@/utils/logger';

interface Voucher {
  id: number;
  presignedImage: string;
  name: string;
  expiration: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  registeredUserId: number;
  isWishList: boolean;
}

interface GroupVouchers {
  groupId: number;
  groupTitle: string;
  groupInviteCode: string;
  vouchers: Voucher[];
}

// Spring Slice 응답이 아닌 커스텀 응답으로 변경
interface VoucherResponse {
  content: GroupVouchers[];
  size: number;
  hasNext: boolean;
}

function GroupDetailPageContent() {
  const params = useParams();
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
  const [filterCondition, setFilterCondition] = useState<VoucherFilterCondition>(createDefaultFilterCondition());
  
  const pageSize = 10;

  const fetchVouchers = useCallback(async (cursor: number | null = null, condition: VoucherFilterCondition = filterCondition) => {
    try {
      const token = localStorage.getItem('accessToken');

      const queryParams = new URLSearchParams({
        pageSize: pageSize.toString()
      });

      // 커서 추가
      if (cursor) {
        queryParams.append('cursorId', cursor.toString());
      }

      // 상태 필터 추가 (복수)
      if (condition.voucherStatuses && condition.voucherStatuses.length > 0) {
        condition.voucherStatuses.forEach(status => {
          queryParams.append('voucherStatuses', status);
        });
      }

      // 날짜 필터 추가
      if (condition.startDay) {
        queryParams.append('startDay', condition.startDay);
      }
      if (condition.endDay) {
        queryParams.append('endDay', condition.endDay);
      }

      const apiUrl = createApiUrl(`/vouchers/${params.id}?${queryParams}`);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });


      
      if (!response.ok) {
        const errorData = await response.text();
        logger.error('API 에러 응답:', errorData);
        
        throw new Error(
          `기프티콘 목록을 불러오는데 실패했습니다. (상태 코드: ${response.status})`
        );
      }

      const data: VoucherResponse = await response.json();
      
      // 서버 응답 데이터 로그 추가
      console.log('=== 서버 응답 데이터 ===');
      console.log('Full response:', data);
      
      if (data.content && data.content.length > 0) {
        const groupData = data.content[0];
        console.log('Group data:', groupData);
        console.log('Vouchers:', groupData.vouchers);
        
        const processedVouchers = groupData.vouchers ? groupData.vouchers.map(voucher => {
          console.log(`Voucher ${voucher.id} isWishList:`, voucher.isWishList);
          return {
            ...voucher,
            presignedImage: voucher.presignedImage
          };
        }) : [];

        if (cursor === null) {
          // 첫 로딩 - 기존 데이터를 완전히 교체
          setVouchers(processedVouchers);
          setGroupTitle(groupData.groupTitle || '');
          setInviteCode(groupData.groupInviteCode || '');
        } else {
          // 추가 로딩 - 중복 방지를 위해 기존 voucher ID와 비교
          setVouchers(prev => {
            const existingIds = new Set(prev.map(v => v.id));
            const newVouchers = processedVouchers.filter(v => !existingIds.has(v.id));
            return [...prev, ...newVouchers];
          });
        }
        
        setHasMore(data.hasNext || false);
        if (processedVouchers.length > 0) {
          setCursorId(processedVouchers[processedVouchers.length - 1].id);
        }
      } else {
        // 데이터가 없는 경우
        if (cursor === null) {
          setVouchers([]);
          setGroupTitle('');
          setInviteCode('');
        }
        setHasMore(false);
      }
    } catch (error) {
      logger.error('기프티콘 목록 조회 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, filterCondition]);

  const loadMore = () => {
    if (!isLoading && hasMore && cursorId) {
      fetchVouchers(cursorId, filterCondition);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newCondition: VoucherFilterCondition) => {
    setFilterCondition(newCondition);
    // 필터 변경 시 첫 페이지부터 다시 로드
    setVouchers([]);
    setCursorId(null);
    setHasMore(true);
    fetchVouchers(null, newCondition);
  }, [fetchVouchers]);

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

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
        body: newFormData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('기프티콘 추가 에러 응답:', errorData);
        
        // 백엔드 오류 메시지 파싱 시도
        let userMessage = '기프티콘 추가에 실패했습니다.';
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message) {
            userMessage = errorJson.message;
          } else if (errorJson.error) {
            userMessage = errorJson.error;
          }
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
          if (response.status === 400) {
            userMessage = '입력한 정보를 확인해주세요. 만료일이 현재 날짜보다 이전인 경우 등록할 수 없습니다.';
          } else if (response.status === 401) {
            userMessage = '로그인이 필요합니다.';
          } else if (response.status === 403) {
            userMessage = '권한이 없습니다.';
          } else if (response.status >= 500) {
            userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
          }
        }
        
        // 백엔드 오류를 그대로 전달하여 모달에서 처리하도록 함
        throw new Error(userMessage);
      }

      // 성공 시 첫 페이지만 다시 로드하여 새로운 기프티콘을 포함시킴
      // 기존 상태를 초기화하고 첫 페이지를 다시 가져옴
      setVouchers([]);
      setCursorId(null);
      setHasMore(true);
      await fetchVouchers();
    } catch (error) {
      logger.error('기프티콘 추가 실패:', error);
      throw error;
    }
  };

  useEffect(() => {
    // 그룹이 변경될 때 상태 초기화
    setVouchers([]);
    setIsLoading(true);
    setError(null);
    setHasMore(true);
    setCursorId(null);
    setGroupTitle('');
    setInviteCode('');
    
    fetchVouchers();
  }, [params.id, fetchVouchers]);

  // 현재 사용자 정보 가져오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
          return;
        }
        
        const response = await fetchWithToken(createApiUrl('/profile'));
        
        if (response.ok) {
          const userData = await response.json();
          const userId = userData.userId || userData.id || userData.memberId;
          setCurrentUserId(userId);
        }
      } catch (error) {
        logger.error('사용자 정보 조회 실패:', error);
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
                className="inline-flex items-center text-blue-500 p-2 rounded-lg hover:bg-blue-50 md:px-3 md:py-2 transition-colors"
                title="멤버 초대"
              >
                <UserPlusIcon className="w-6 h-6" />
                <span className="hidden md:inline ml-1">멤버 초대</span>
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 md:px-3 md:py-2 transition-colors"
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
          onReload={() => fetchVouchers(null, filterCondition)}
          currentUserId={currentUserId || undefined}
          filterCondition={filterCondition}
          onFilterChange={handleFilterChange}
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