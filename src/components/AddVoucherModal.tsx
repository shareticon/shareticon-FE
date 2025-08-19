import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { logger } from '@/utils/logger';
import ModalToast, { ModalToastProps } from './ModalToast';

interface AddVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const AddVoucherModal: React.FC<AddVoucherModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [toasts, setToasts] = useState<ModalToastProps[]>([]);

  // 모달 내부 토스트 관리
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showModalToast = useCallback((toast: Omit<ModalToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ModalToastProps = {
      ...toast,
      id,
      onClose: removeToast,
    };
    setToasts((prev) => [...prev, newToast]);
  }, [removeToast]);

  const showError = useCallback((title: string, message?: string) => {
    showModalToast({ type: 'error', title, message });
  }, [showModalToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showModalToast({ type: 'success', title, message });
  }, [showModalToast]);

  // 연도 옵션 생성 (현재 연도부터 10년)
  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() + i
  );

  // 월 옵션
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 해당 월의 일 수 계산
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  // 일 옵션
  const days = Array.from(
    { length: getDaysInMonth(year, month) },
    (_, i) => i + 1
  );

  // 날짜가 변경될 때마다 expiryDate 문자열 생성
  const formatDate = (year: number, month: number, day: number) => {
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    return `${year}-${formattedMonth}-${formattedDay}`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageError(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !name) return;

    // 만료일 유효성 검사
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 시간 부분을 0으로 설정하여 날짜만 비교
    
    if (selectedDate < today) {
      showError('잘못된 만료일', '만료일은 오늘 날짜 이후여야 합니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', name);
      formData.append('expiryDate', formatDate(year, month, day));
      
      await onSubmit(formData);
      
      // 성공 메시지 표시 후 잠시 후 모달 닫기
      showSuccess('기프티콘 등록 완료', '기프티콘이 성공적으로 등록되었습니다.');
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      logger.error('기프티콘 추가 실패:', error);
      
      // 오류 메시지를 모달 내부에 표시
      if (error instanceof Error) {
        showError('기프티콘 등록 실패', error.message);
      } else {
        showError('기프티콘 등록 실패', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setName('');
    setYear(new Date().getFullYear());
    setMonth(new Date().getMonth() + 1);
    setDay(new Date().getDate());
    setImageError(false);
    setToasts([]); // 토스트도 초기화
    onClose();
  };

  // 월이 변경될 때 해당 월의 최대 일수를 넘지 않도록 조정
  useEffect(() => {
    const maxDays = getDaysInMonth(year, month);
    if (day > maxDays) {
      setDay(maxDays);
    }
  }, [year, month, day]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <div className="absolute right-4 top-4">
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <Dialog.Title className="text-xl font-semibold text-gray-900 mb-6">
            기프티콘 추가
          </Dialog.Title>

          {/* 모달 내부 토스트 컨테이너 */}
          {toasts.length > 0 && (
            <div className="mb-4 space-y-2">
              {toasts.map((toast) => (
                <ModalToast key={toast.id} {...toast} />
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기프티콘 이미지
              </label>
              <div className={`flex justify-center rounded-lg border-2 border-dashed ${selectedFile ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300'} px-6 py-10 transition-colors`}>
                {selectedFile ? (
                  <div className="relative h-48 w-full">
                    {imageError ? (
                      <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">이미지 미리보기를 표시할 수 없습니다</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={URL.createObjectURL(selectedFile)}
                          alt="선택된 기프티콘 이미지"
                          fill
                          className="object-contain"
                          onError={() => setImageError(true)}
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImageError(false);
                          }}
                          className="absolute right-2 top-2 rounded-full bg-white/80 p-1 shadow-md hover:bg-white transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4 text-gray-500" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>이미지 업로드</span>
                        <input
                          id="image-upload"
                          name="image-upload"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                          required
                        />
                      </label>
                      <p className="pl-1">또는 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs leading-5 text-gray-600 mt-2">
                      카메라 또는 앨범에서 선택 · PNG, JPG, GIF (최대 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                기프티콘 이름
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pl-3 pr-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="예: 스타벅스 아메리카노"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                기프티콘 만료일
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm appearance-none bg-white cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm appearance-none bg-white cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}월
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm appearance-none bg-white cursor-pointer"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}일
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedFile || !name}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '추가 중...' : '추가하기'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 