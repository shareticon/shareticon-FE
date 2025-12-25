import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon, TrashIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { fetchWithToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import { logger } from '@/utils/logger';
import { VoucherFilterCondition, VoucherStatus, SortOrder } from '@/types/voucher';
import { useToast } from '@/contexts/ToastContext';

interface Voucher {
  id: number;
  presignedImage: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  name: string;
  expiration: string;
  groupId?: number;
  registeredUserId?: number;
  isWishList?: boolean;
}

interface VoucherListProps {
  vouchers: Voucher[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  groupId: number;
  onReload?: () => void;
  currentUserId?: number;
  filterCondition: VoucherFilterCondition;
  onFilterChange: (condition: VoucherFilterCondition) => void;
}


const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  if (url === 'image') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const STATUS_LABEL: Record<VoucherStatus, string> = {
  AVAILABLE: '사용가능',
  USED: '사용완료',
  EXPIRED: '만료됨',
};
const STATUS_BADGE: Record<VoucherStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-800',
  USED: 'bg-gray-100 text-gray-800',
  EXPIRED: 'bg-red-100 text-red-800',
};

export const VoucherList: React.FC<VoucherListProps> = ({
  vouchers = [],
  onLoadMore,
  hasMore,
  isLoading,
  groupId,
  onReload,
  currentUserId,
  filterCondition,
  onFilterChange,
}) => {
  const { showInfo } = useToast();
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [modalVoucher, setModalVoucher] = useState<Voucher | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [likedVouchers, setLikedVouchers] = useState<Record<number, boolean>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  
  // 필터 조건에서 현재 선택된 상태들을 가져옴
  const selectedStatuses = new Set(filterCondition.voucherStatuses || ['AVAILABLE', 'USED']);
  
  // 날짜 필터 로컬 상태 (UI에서만 사용)
  const [localDateFrom, setLocalDateFrom] = useState<string>(filterCondition.startDay || '');
  const [localDateTo, setLocalDateTo] = useState<string>(filterCondition.endDay || '');
  const [localStatuses, setLocalStatuses] = useState<Set<VoucherStatus>>(new Set(filterCondition.voucherStatuses || ['AVAILABLE', 'USED']));

  // filterCondition이 변경될 때 로컬 상태 동기화
  useEffect(() => {
    setLocalDateFrom(filterCondition.startDay || '');
    setLocalDateTo(filterCondition.endDay || '');
    setLocalStatuses(new Set(filterCondition.voucherStatuses || ['AVAILABLE', 'USED']));
  }, [filterCondition]);

  // 찜 상태 토글 함수
  const toggleLike = async (voucherId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // 현재 찜 상태를 즉시 UI에 반영 (Optimistic Update)
      const currentLikedState = likedVouchers[voucherId] || false;
      const newLikedState = !currentLikedState;
      
      setLikedVouchers(prev => ({
        ...prev,
        [voucherId]: newLikedState
      }));

      // 찜 토글 API 호출
      const response = await fetchWithToken(
        createApiUrl(`/wishList/group/${groupId}/voucher/${voucherId}`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.ok) {
        // API 호출 실패 시 원래 상태로 되돌리기
        setLikedVouchers(prev => ({
          ...prev,
          [voucherId]: currentLikedState
        }));
        throw new Error('찜 상태 변경에 실패했습니다.');
      }

    } catch (error) {
      logger.error('찜 상태 토글 실패:', error);
    }
  };

  // 서버에서 받은 isWishList 값으로 찜 상태 초기화
  useEffect(() => {
    logger.log('=== VoucherList 찜 상태 초기화 ===');
    logger.log('받은 vouchers:', vouchers);
    
    const newState: Record<number, boolean> = {};
    vouchers.forEach(voucher => {
      logger.log(`Voucher ${voucher.id}: isWishList = ${voucher.isWishList} (type: ${typeof voucher.isWishList})`);
      
      if (voucher.isWishList !== undefined) {
        newState[voucher.id] = voucher.isWishList;
      }
    });
    
    logger.log('설정할 찜 상태:', newState);
    setLikedVouchers(newState);
  }, [vouchers]);

  // filterCondition 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setLocalDateFrom(filterCondition.startDay || '');
    setLocalDateTo(filterCondition.endDay || '');
    setLocalStatuses(new Set(filterCondition.voucherStatuses || ['AVAILABLE', 'USED']));
  }, [filterCondition]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  // ESC 키로 전체화면 이미지 닫기
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (fullscreenImage) {
          setFullscreenImage(null);
        } else if (modalVoucher) {
          setModalVoucher(null);
        }
      }
    }
    
    if (fullscreenImage || modalVoucher) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // 스크롤 방지
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenImage, modalVoucher]);

  // 무한 스크롤을 위한 Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);



  const handleImageError = (voucherId: number) => {
    setImageErrors(prev => ({ ...prev, [voucherId]: true }));
  };

  // 로컬 상태 변경 핸들러들 (필터 창에서만 사용)
  const handleLocalStatusChange = (status: VoucherStatus) => {
    const newStatuses = new Set(localStatuses);
    if (newStatuses.has(status)) {
      newStatuses.delete(status);
    } else {
      newStatuses.add(status);
    }
    setLocalStatuses(newStatuses);
  };

  // 필터 적용
  const handleFilterApply = () => {
    // 아무것도 선택하지 않았을 때 백엔드 기본값 적용
    let finalStatuses = Array.from(localStatuses);
    let finalStartDay = localDateFrom;
    let finalEndDay = localDateTo;
    
    // 상태를 아무것도 선택하지 않았는지 확인
    const noStatusSelected = localStatuses.size === 0;
    
    // 상태가 하나도 선택되지 않았으면 기본값 적용
    if (localStatuses.size === 0) {
      finalStatuses = ['AVAILABLE', 'USED'];
      setLocalStatuses(new Set(finalStatuses));
    }
    
    // 날짜가 둘 다 비어있으면 백엔드 기본값(오늘부터 다음 달 마지막 날) 적용
    if (!finalStartDay && !finalEndDay) {
      const today = new Date();
      // 백엔드 로직과 동일: plusMonths(1).with(TemporalAdjusters.lastDayOfMonth())
      // 다음 달의 마지막 날 (로컬 시간대 기준)
      const nextMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      // 로컬 시간대 기준으로 날짜 문자열 생성
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      finalStartDay = formatLocalDate(today);
      finalEndDay = formatLocalDate(nextMonthLastDay);
      
      // UI 상태도 업데이트
      setLocalDateFrom(finalStartDay);
      setLocalDateTo(finalEndDay);
    }
    
    // 상태를 선택하지 않았을 때 토스트 메시지 표시
    if (noStatusSelected) {
      showInfo('아무것도 선택하지 않으면 기본 조건이 적용됩니다', undefined, 3000);
    }
    
    const newCondition: VoucherFilterCondition = {
      voucherStatuses: finalStatuses,
      startDay: finalStartDay || undefined,
      endDay: finalEndDay || undefined,
    };
    
    onFilterChange(newCondition);
    setFilterOpen(false);
  };

  // 필터 취소
  const handleFilterCancel = () => {
    setLocalDateFrom(filterCondition.startDay || '');
    setLocalDateTo(filterCondition.endDay || '');
    setLocalStatuses(new Set(filterCondition.voucherStatuses || ['AVAILABLE', 'USED']));
    setFilterOpen(false);
  };

  // 백엔드에서 이미 필터링된 데이터가 오므로 정렬만 수행
  const sortedVouchers = vouchers.sort((a, b) => {
    const dateA = new Date(a.expiration).getTime();
    const dateB = new Date(b.expiration).getTime();
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  // 쿠폰 사용완료로 변경 (API 연동)
  const handleUseVoucher = async (voucherId: number) => {
    if (!groupId) {
      alert('그룹 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 쿠폰을 사용완료로 변경하시겠습니까?')) return;
    try {
      const response = await fetchWithToken(createApiUrl(`/vouchers/group/${groupId}/voucher/${voucherId}`), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'USED' }),
      });
      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }
      // 성공 시 프론트 상태 변경
      if (Array.isArray(vouchers) && typeof vouchers[0] === 'object') {
        const idx = vouchers.findIndex(v => v.id === voucherId);
        if (idx !== -1) {
          vouchers[idx].status = 'USED';
        }
      }
      // 성공 시 화면 새로고침 콜백 호출
      if (onReload) onReload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 쿠폰 사용취소 (API 연동)
  const handleCancelUseVoucher = async (voucherId: number) => {
    if (!groupId) {
      alert('그룹 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 쿠폰을 사용취소하시겠습니까?')) return;
    try {
      const response = await fetchWithToken(createApiUrl(`/vouchers/group/${groupId}/voucher/${voucherId}`), {
        method: 'PATCH',
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }
      // 성공 시 프론트 상태 변경
      if (Array.isArray(vouchers) && typeof vouchers[0] === 'object') {
        const idx = vouchers.findIndex(v => v.id === voucherId);
        if (idx !== -1) {
          vouchers[idx].status = 'AVAILABLE';
        }
      }
      // 성공 시 화면 새로고침 콜백 호출
      if (onReload) onReload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 기프티콘 삭제 (API 연동)
  const handleDeleteVoucher = async (voucherId: number) => {
    if (!groupId) {
      alert('그룹 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 기프티콘을 삭제하시겠습니까?\n삭제된 기프티콘은 복구할 수 없습니다.')) return;
    try {
      const response = await fetchWithToken(createApiUrl(`/vouchers/group/${groupId}/voucher/${voucherId}`), {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('기프티콘 삭제에 실패했습니다.');
      }
      // 성공 시 화면 새로고침 콜백 호출
      if (onReload) onReload();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="p-4">
      <div className="sticky top-[88px] z-30 bg-white mb-3 w-full flex items-center min-h-[40px] border border-gray-200 shadow-sm rounded-lg">
        <div className="relative flex-shrink-0 bg-white rounded-l-lg rounded-r-none" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`inline-flex items-center gap-1 px-2 sm:px-4 h-10 rounded-l-lg rounded-r-none border-0 border-r border-gray-200 bg-white text-gray-700 text-xs font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${filterOpen ? 'z-30' : ''}`}
            style={{ minWidth: 56 }}
            aria-label="필터 열기"
          >
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">필터</span>
            <ChevronDownIcon className={`w-4 h-4 ml-0.5 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>
          {filterOpen && (
            <div className="absolute left-0 top-full w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 overflow-hidden mt-0.5">
              {/* 상태 필터 섹션 */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-xs text-gray-500 font-medium mb-3">상태</div>
                <div className="space-y-2">
                  {(['AVAILABLE', 'USED', 'EXPIRED'] as VoucherStatus[]).map(status => (
                    <label
                      key={status}
                      className="flex items-center gap-3 py-1 cursor-pointer group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={localStatuses.has(status)}
                          onChange={() => handleLocalStatusChange(status)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          localStatuses.has(status) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 group-hover:border-gray-400'
                        }`}>
                          {localStatuses.has(status) && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_BADGE[status]}`}>
                        {STATUS_LABEL[status]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 날짜 필터 섹션 */}
              <div className="px-4 py-3">
                <div className="text-xs text-gray-500 font-medium mb-3">만료일 범위</div>
                
                {/* 시작일 */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-2">시작일</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={localDateFrom}
                      onChange={(e) => setLocalDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border-0 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all text-gray-700 font-medium"
                      style={{
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                      max={localDateTo || undefined}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 종료일 */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-600 mb-2">종료일</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={localDateTo}
                      onChange={(e) => setLocalDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border-0 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all text-gray-700 font-medium"
                      style={{
                        colorScheme: 'light',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                        appearance: 'none',
                        backgroundImage: 'none',
                        outline: 'none',
                        boxShadow: 'none',
                      }}
                      min={localDateFrom || undefined}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 빠른 선택 버튼 */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setLocalDateFrom(today.toISOString().split('T')[0]);
                      setLocalDateTo('');
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    오늘부터
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const weekLater = new Date(today);
                      weekLater.setDate(today.getDate() + 7);
                      setLocalDateFrom(today.toISOString().split('T')[0]);
                      setLocalDateTo(weekLater.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    일주일
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const monthLater = new Date(today);
                      monthLater.setMonth(today.getMonth() + 1);
                      setLocalDateFrom(today.toISOString().split('T')[0]);
                      setLocalDateTo(monthLater.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    한달
                  </button>
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleFilterApply}
                    className="flex-1 bg-blue-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    적용
                  </button>
                  <button
                    onClick={handleFilterCancel}
                    className="px-4 bg-gray-100 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2 items-center bg-gray-50 min-h-[40px] px-2 sm:px-4 flex-1 rounded-r-lg rounded-l-none overflow-hidden">
          <div className="flex gap-1 sm:gap-2 items-center flex-wrap py-2">
            {Array.from(selectedStatuses).map(status => (
              <span key={status} className={`text-xs px-1.5 sm:px-2 py-1 rounded-full font-medium ${STATUS_BADGE[status as VoucherStatus]}`}>{STATUS_LABEL[status as VoucherStatus]}</span>
            ))}
            
          {/* 날짜 필터 표시 */}
          {(filterCondition.startDay || filterCondition.endDay) && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {filterCondition.startDay && filterCondition.endDay
                ? `${filterCondition.startDay} ~ ${filterCondition.endDay}`
                : filterCondition.startDay
                ? `${filterCondition.startDay} 이후`
                : `${filterCondition.endDay} 이전`}
            </span>
          )}
          </div>
          <div className="flex-1 min-w-2" />
          <div className="flex items-center gap-1 text-gray-600 flex-shrink-0">
            <span className="text-xs hidden sm:inline">만료일</span>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center gap-0.5 hover:text-gray-900 transition-colors text-xs h-8 px-1 sm:px-2"
            >
              <span className="text-xs hidden sm:inline">{sortOrder === 'asc' ? '오름차순' : '내림차순'}</span>
              <span className="sm:hidden">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              {sortOrder === 'asc' ? (
                <ChevronUpIcon className="w-3.5 h-3.5 hidden sm:block" />
              ) : (
                <ChevronDownIcon className="w-3.5 h-3.5 hidden sm:block" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 기프티콘 그리드 또는 빈 상태 메시지 */}
      {!vouchers || vouchers.length === 0 ? (
        <div className="p-8 text-center text-gray-600">
          <p>표시할 기프티콘이 없습니다.</p>
          <p className="text-sm mt-1">필터 조건을 변경하거나 새 기프티콘을 추가해보세요.</p>
        </div>
      ) : (
        <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4 z-0 pt-[56px] px-2">
          {sortedVouchers.map((voucher) => (
            <div
            key={voucher.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => {
              if (isValidImageUrl(voucher.presignedImage) && !imageErrors[voucher.id]) {
                setModalVoucher(voucher);
              }
            }}
          >
            <div className="relative pb-[100%]">
              {/* 등록한 사용자만 볼 수 있는 삭제 버튼 */}
              {(() => {
                const canDelete = currentUserId && voucher.registeredUserId && currentUserId === voucher.registeredUserId;
                return canDelete ? (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteVoucher(voucher.id); }}
                    className="absolute top-1 left-1 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-30"
                    title="기프티콘 삭제"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                ) : null;
              })()}
              
              {/* 하트 아이콘 오버레이 */}
              <div className={`absolute top-1 right-1 transition-opacity duration-200 z-30 ${
                likedVouchers[voucher.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <button
                  onClick={(e) => toggleLike(voucher.id, e)}
                  className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-sm"
                >
                  {likedVouchers[voucher.id] ? (
                    <HeartIconSolid className="w-4 h-4 text-red-500" />
                  ) : (
                    <HeartIcon className="w-4 h-4 text-gray-700 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
              
              {isValidImageUrl(voucher.presignedImage) && !imageErrors[voucher.id] ? (
                <img
                  src={voucher.presignedImage}
                  alt="기프티콘 이미지"
                  onError={() => handleImageError(voucher.id)}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {/* 사용완료/만료 레이어 */}
              {(voucher.status === 'USED' || voucher.status === 'EXPIRED') && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                  <span className="flex items-center justify-center">
                    <span className="flex flex-col items-center justify-center rounded-full bg-black/50 px-6 py-4 text-center whitespace-pre-line shadow-lg" style={{ minWidth: 100, minHeight: 100 }}>
                      <span className={`text-base font-bold text-white drop-shadow-lg whitespace-pre-line text-center ${voucher.status === 'USED' ? '' : 'text-red-200'}`}>{voucher.status === 'USED' ? '기프티콘\n사용완료' : '만료된\n기프티콘'}</span>
                    </span>
                  </span>
                </div>
              )}
              {voucher.status === 'AVAILABLE' && (
                <button
                  onClick={e => { e.stopPropagation(); handleUseVoucher(voucher.id); }}
                  className="absolute bottom-1 right-1 bg-blue-500 text-white rounded px-2 py-0.5 text-xs font-medium shadow hover:bg-blue-600 transition-colors z-20"
                >
                  사용완료
                </button>
              )}
              {voucher.status === 'USED' && (
                <button
                  onClick={e => { e.stopPropagation(); handleCancelUseVoucher(voucher.id); }}
                  className="absolute bottom-1 right-1 bg-gray-600 text-white rounded px-2 py-0.5 text-xs font-medium shadow hover:bg-gray-700 transition-colors z-20"
                >
                  사용취소
                </button>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate" title={voucher.name}>
                {voucher.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                만료일: {voucher.expiration}
              </p>
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  voucher.status === 'AVAILABLE' 
                    ? 'bg-green-100 text-green-800'
                    : voucher.status === 'USED'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {voucher.status === 'AVAILABLE' ? '사용가능' : 
                   voucher.status === 'USED' ? '사용완료' : '만료됨'}
                </span>
              </div>
            </div>
          </div>
        ))}

          {/* 무한 스크롤을 위한 관찰 요소 */}
          <div ref={observerRef} className="h-4 mt-4">
            {isLoading && (
              <div className="text-center text-gray-500 text-sm">
                로딩 중...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {modalVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setModalVoucher(null)}>
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6 flex flex-col" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors" onClick={() => setModalVoucher(null)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="mb-4">
              <img 
                src={modalVoucher.presignedImage} 
                alt="기프티콘 이미지" 
                className="w-full h-auto object-contain max-h-[60vh] rounded-lg cursor-pointer hover:opacity-90 transition-opacity" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenImage(modalVoucher.presignedImage);
                }}
                title="클릭하면 크게 볼 수 있습니다"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 leading-6">
                  {modalVoucher.name}
                </h3>
                <button
                  onClick={(e) => toggleLike(modalVoucher.id, e)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {likedVouchers[modalVoucher.id] ? (
                    <HeartIconSolid className="w-6 h-6 text-red-500" />
                  ) : (
                    <HeartIcon className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">만료일</span>
                <span className="text-sm font-medium text-gray-900">{modalVoucher.expiration}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">상태</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  modalVoucher.status === 'AVAILABLE' 
                    ? 'bg-green-100 text-green-800'
                    : modalVoucher.status === 'USED'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {modalVoucher.status === 'AVAILABLE' ? '사용가능' : 
                   modalVoucher.status === 'USED' ? '사용완료' : '만료됨'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 전체화면 이미지 뷰어 */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 cursor-pointer" 
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={fullscreenImage} 
              alt="기프티콘 전체화면" 
              className="max-w-full max-h-full object-contain rounded-lg cursor-pointer"
              onClick={() => setFullscreenImage(null)}
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/80 text-sm bg-black/50 px-3 py-1 rounded-full pointer-events-none">
              이미지를 클릭하거나 ESC를 눌러 닫기
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 