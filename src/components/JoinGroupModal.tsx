'use client';

import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { logger } from '@/utils/logger';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => Promise<void>;
  error?: string | null;
  successMessage?: string | null;
  isLoading?: boolean;
}

export default function JoinGroupModal({ isOpen, onClose, onSubmit, error, successMessage, isLoading }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || isLoading) return;
    
    try {
      await onSubmit(inviteCode.trim());
      setInviteCode(''); // 성공 시에만 초기화
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
      logger.error('그룹 참여 실패:', error);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setInviteCode('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-indigo-900">그룹 참여하기</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600">
            초대 코드를 입력하여 그룹에 참여하세요.
          </p>
          
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}
          
          {error && !successMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          
          <div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="초대 코드 입력"
              className="w-full px-4 py-3 font-mono text-lg tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              maxLength={10}
              disabled={isLoading || !!successMessage}
            />
          </div>

          {!successMessage && (
            <button
              type="submit"
              disabled={inviteCode.length !== 10 || isLoading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  참여 중...
                </>
              ) : (
                '참여하기'
              )}
            </button>
          )}

          {successMessage && (
            <button
              type="button"
              onClick={handleClose}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              확인
            </button>
          )}
        </form>
      </div>
    </div>
  );
} 