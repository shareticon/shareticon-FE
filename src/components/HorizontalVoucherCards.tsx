import React, { useState, useRef, useEffect } from 'react';
import { PhotoIcon, XMarkIcon, HeartIcon } from '@heroicons/react/24/outline';
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
  registeredUserId?: number;
  isWishList?: boolean;
  groupId?: number;
}

interface HorizontalVoucherCardsProps {
  vouchers: Voucher[];
  title: string;
  emptyMessage: string;
  onRefresh?: () => Promise<void>;
}

const HorizontalVoucherCards: React.FC<HorizontalVoucherCardsProps> = ({
  vouchers,
  title,
  emptyMessage,
  onRefresh
}) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [modalVoucher, setModalVoucher] = useState<Voucher | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [likedVouchers, setLikedVouchers] = useState<Record<number, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isTouching, setIsTouching] = useState(false);

  const handleImageError = (voucherId: number) => {
    setImageErrors(prev => ({ ...prev, [voucherId]: true }));
  };

  const isValidImageUrl = (url: string | undefined | null): boolean => {
    return !!(url && url.trim() && url !== 'null' && url !== 'undefined');
  };

  // 찜 상태 토글 함수
  const toggleLike = async (voucherId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDragging || dragDistance > 5) {
      return;
    }
    
    try {
      // 현재 찜 상태를 즉시 UI에 반영 (Optimistic Update)
      const currentLikedState = likedVouchers[voucherId] || false;
      
      setLikedVouchers(prev => ({
        ...prev,
        [voucherId]: !currentLikedState
      }));

      // 해당 쿠폰의 groupId를 찾기
      const voucher = vouchers.find(v => v.id === voucherId);
      if (!voucher || !voucher.groupId) {
        // 원래 상태로 되돌리기
        setLikedVouchers(prev => ({
          ...prev,
          [voucherId]: currentLikedState
        }));
        return;
      }

      // 찜 토글 API 호출
      const response = await fetchWithToken(
        createApiUrl(`/wishList/group/${voucher.groupId}/voucher/${voucherId}`),
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

  // 쿠폰 사용완료로 변경 (API 연동)
  const handleUseVoucher = async (voucherId: number) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher?.groupId) {
      alert('그룹 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 쿠폰을 사용완료로 변경하시겠습니까?')) return;
    
    try {
      const response = await fetchWithToken(createApiUrl(`/vouchers/group/${voucher.groupId}/voucher/${voucherId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'USED' }),
      });
      
      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }
      
      // 성공 시 홈 데이터 새로고침
      if (onRefresh) {
        await onRefresh();
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 쿠폰 사용취소 (API 연동)
  const handleCancelUseVoucher = async (voucherId: number) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher?.groupId) {
      alert('그룹 정보가 없습니다.');
      return;
    }
    if (!window.confirm('이 쿠폰을 사용취소하시겠습니까?')) return;
    
    try {
      const response = await fetchWithToken(createApiUrl(`/vouchers/group/${voucher.groupId}/voucher/${voucherId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      
      if (!response.ok) {
        throw new Error('상태 변경에 실패했습니다.');
      }
      
      // 성공 시 홈 데이터 새로고침
      if (onRefresh) {
        await onRefresh();
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '상태 변경 중 오류가 발생했습니다.');
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

  // 마우스 휠 스크롤
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.preventDefault();
      const scrollAmount = e.deltaY * 0.8;
      scrollRef.current.scrollLeft += scrollAmount;
    }
  };

  // 마우스 드래그 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scrollRef.current) {
      setIsMouseDown(true);
      setIsDragging(false);
      setStartX(e.pageX - scrollRef.current.offsetLeft);
      setScrollLeft(scrollRef.current.scrollLeft);
      setDragDistance(0);
      setDragStartTime(Date.now());
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !scrollRef.current) return;
    
    const x = e.pageX - scrollRef.current.offsetLeft;
    const distance = Math.abs(x - startX);
    setDragDistance(distance);
    
    if (distance > 10 || (Date.now() - dragStartTime > 200)) {
      if (!isDragging) {
        setIsDragging(true);
      }
      e.preventDefault();
      const walk = (x - startX) * 1.2;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setTimeout(() => {
      setIsDragging(false);
      setDragDistance(0);
    }, 50);
  };

  // 터치 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      setIsTouching(true);
      setIsDragging(false);
      setStartX(touch.pageX - scrollRef.current.offsetLeft);
      setScrollLeft(scrollRef.current.scrollLeft);
      setDragDistance(0);
      setDragStartTime(Date.now());
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouching || !scrollRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const x = touch.pageX - scrollRef.current.offsetLeft;
    const distance = Math.abs(x - startX);
    setDragDistance(distance);
    
    if (distance > 5 || (Date.now() - dragStartTime > 150)) {
      if (!isDragging) {
        setIsDragging(true);
      }
      e.preventDefault();
      const walk = (x - startX) * 1;
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
    setTimeout(() => {
      setIsDragging(false);
      setDragDistance(0);
    }, 50);
  };

  // 빈 상태 렌더링
  if (vouchers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-indigo-900">{title}</h2>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-600 border border-gray-200">
          {emptyMessage}
        </div>
      </div>
    );
  }



  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-indigo-900">{title}</h2>
        </div>
        
        {/* 가로 스크롤 카드 영역 */}
        <div 
          ref={scrollRef}
          className={`overflow-x-auto scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} select-none bg-gray-100 rounded-lg p-4 border border-gray-200`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsMouseDown(false);
            setIsDragging(false);
            setDragDistance(0);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex gap-3" style={{ width: 'max-content' }}>
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex-shrink-0 group w-[140px]"
                onClick={(e) => {
                  if (isDragging || dragDistance > 5) {
                    e.preventDefault();
                    return;
                  }
                  if (isValidImageUrl(voucher.presignedImage) && !imageErrors[voucher.id]) {
                    setModalVoucher(voucher);
                  }
                }}
              >
                <div className="relative aspect-[4/3]">
                  {/* 이미지 영역 */}
                  {isValidImageUrl(voucher.presignedImage) && !imageErrors[voucher.id] ? (
                    <img
                      src={voucher.presignedImage}
                      alt="기프티콘 이미지"
                      onError={() => handleImageError(voucher.id)}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <PhotoIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {/* 사용완료/만료 레이어 */}
                  {(voucher.status === 'USED' || voucher.status === 'EXPIRED') && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
                      <span className="flex items-center justify-center">
                        <span className="flex flex-col items-center justify-center rounded-full bg-black/50 px-4 py-3 text-center whitespace-pre-line shadow-lg" style={{ minWidth: 80, minHeight: 80 }}>
                          <span className={`text-sm font-bold text-white drop-shadow-lg whitespace-pre-line text-center ${voucher.status === 'USED' ? '' : 'text-red-200'}`}>
                            {voucher.status === 'USED' ? '기프티콘\n사용완료' : '만료된\n기프티콘'}
                          </span>
                        </span>
                      </span>
                    </div>
                  )}
                  
                  {/* 사용완료 버튼 */}
                  {voucher.status === 'AVAILABLE' && (
                    <button
                      onClick={e => { e.stopPropagation(); handleUseVoucher(voucher.id); }}
                      className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded px-2 py-0.5 text-xs font-medium shadow hover:bg-indigo-700 transition-colors z-20"
                    >
                      사용완료
                    </button>
                  )}
                  
                  {/* 사용취소 버튼 */}
                  {voucher.status === 'USED' && (
                    <button
                      onClick={e => { e.stopPropagation(); handleCancelUseVoucher(voucher.id); }}
                      className="absolute bottom-1 right-1 bg-gray-600 text-white rounded px-2 py-0.5 text-xs font-medium shadow hover:bg-gray-700 transition-colors z-20"
                    >
                      사용취소
                    </button>
                  )}
                  
                  {/* 하트 아이콘 오버레이 */}
                  <div className={`absolute top-2 right-2 transition-opacity duration-200 ${
                    likedVouchers[voucher.id] ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <button
                      onClick={(e) => toggleLike(voucher.id, e)}
                      className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 transition-colors shadow-sm"
                    >
                      {likedVouchers[voucher.id] ? (
                        <HeartIconSolid className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-700 hover:text-red-500 transition-colors" />
                      )}
                    </button>
                  </div>
                  
                  {/* 사용완료/만료 레이어 */}
                  {(voucher.status === 'USED' || voucher.status === 'EXPIRED') && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="bg-black/50 px-2 py-1 rounded text-white text-xs font-semibold">
                        {voucher.status === 'USED' ? '사용완료' : '만료됨'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* 카드 하단 정보 */}
                <div className="p-2">
                  <h3 className="font-medium text-gray-900 text-xs truncate" title={voucher.name}>
                    {voucher.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {voucher.expiration}
                  </p>
                  <div className="mt-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
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
        </div>
      </div>

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
              
              {/* 모달에서 사용완료/사용취소 버튼 */}
              {modalVoucher.status === 'AVAILABLE' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUseVoucher(modalVoucher.id); setModalVoucher(null); }}
                    className="w-full bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    사용완료로 변경
                  </button>
                </div>
              )}
              
              {modalVoucher.status === 'USED' && (
                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleCancelUseVoucher(modalVoucher.id); setModalVoucher(null); }}
                    className="w-full bg-gray-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    사용취소
                  </button>
                </div>
              )}
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
    </>
  );
};

export default HorizontalVoucherCards; 