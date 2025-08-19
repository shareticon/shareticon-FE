import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon, TrashIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { fetchWithToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import { logger } from '@/utils/logger';

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
}

type SortOrder = 'asc' | 'desc';
type StatusFilter = 'AVAILABLE' | 'USED' | 'EXPIRED';

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

const STATUS_LABEL: Record<StatusFilter, string> = {
  AVAILABLE: '사용가능',
  USED: '사용완료',
  EXPIRED: '만료됨',
};
const STATUS_BADGE: Record<StatusFilter, string> = {
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
}) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [modalVoucher, setModalVoucher] = useState<Voucher | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [likedVouchers, setLikedVouchers] = useState<Record<number, boolean>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<StatusFilter>>(new Set(['AVAILABLE', 'USED']));
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

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

  // 서버에서 받은 isWishList 값으로 찜 상태 초기화 (기존 로컬 변경사항 보존)
  useEffect(() => {
    setLikedVouchers(prev => {
      const newState = { ...prev };
      vouchers.forEach(voucher => {
        // 로컬에서 변경된 적이 없는 경우에만 서버 값으로 설정
        if (!(voucher.id in prev)) {
          if (voucher.isWishList !== undefined) {
            newState[voucher.id] = voucher.isWishList;
          }
        }
      });
      return newState;
    });
  }, [vouchers]);

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

  const handleStatusChange = (status: StatusFilter) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const filteredAndSortedVouchers = vouchers
    .filter(voucher => {
      const status = (voucher.status || '').toUpperCase().trim() as StatusFilter;
      return Array.from(selectedStatuses).some(sel => sel === status);
    })
    .sort((a, b) => {
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

  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        <p>아직 등록된 기프티콘이 없습니다.</p>
        <p className="text-sm mt-1">기프티콘을 추가해보세요!</p>
      </div>
    );
  }



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
            <div className="absolute left-0 top-full w-44 bg-white border border-gray-200 rounded-b-xl rounded-tr-xl shadow-xl z-30 py-2 mt-0.5">
              <div className="px-4 py-2 text-xs text-gray-400 font-semibold">상태 필터</div>
              {(['AVAILABLE', 'USED', 'EXPIRED'] as StatusFilter[]).map(status => (
                <label
                  key={status}
                  className="flex items-center gap-2 px-4 py-2 cursor-pointer text-gray-700 hover:bg-gray-50 rounded-md"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.has(status)}
                    onChange={() => handleStatusChange(status)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2 items-center bg-gray-50 h-10 px-2 sm:px-4 min-w-0 overflow-x-auto scrollbar-hide flex-1 rounded-r-lg rounded-l-none">
          {Array.from(selectedStatuses).map(status => (
            <span key={status} className={`text-xs px-1.5 sm:px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
          ))}
          <div className="flex-1 min-w-2" />
          <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 h-10 px-2 sm:px-4 rounded-r-lg text-gray-600 flex-shrink-0">
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

      <div className="relative grid grid-cols-2 md:grid-cols-3 gap-4 z-0 pt-[56px] px-2">
        {filteredAndSortedVouchers.map((voucher) => (
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
                  className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded px-2 py-0.5 text-xs font-medium shadow hover:bg-indigo-700 transition-colors z-20"
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
      </div>
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
      
      {/* 무한 스크롤을 위한 관찰 요소 */}
      <div ref={observerRef} className="h-4 mt-4">
        {isLoading && (
          <div className="text-center text-gray-500 text-sm">
            로딩 중...
          </div>
        )}
      </div>
    </div>
  );
}; 