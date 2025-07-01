'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface EditUserNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newNickname: string) => Promise<void>;
  currentNickname: string;
}

export default function EditUserNicknameModal({
  isOpen,
  onClose,
  onSubmit,
  currentNickname
}: EditUserNicknameModalProps) {
  const [newNickname, setNewNickname] = useState(currentNickname);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(newNickname);
      onClose();
    } catch (error) {
      console.error('닉네임 수정 실패:', error);
      alert('닉네임 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">닉네임 수정</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
              새로운 닉네임
            </label>
            <input
              type="text"
              id="nickname"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              placeholder="새로운 닉네임을 입력하세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !newNickname.trim() || newNickname === currentNickname}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '수정 중...' : '수정하기'}
          </button>
        </form>
      </div>
    </div>
  );
} 