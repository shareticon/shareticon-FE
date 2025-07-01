'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

export default function JoinGroupModal({ isOpen, onClose, onSubmit }: JoinGroupModalProps) {
  const [inviteCode, setInviteCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inviteCode);
    setInviteCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-indigo-900">그룹 참여하기</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-gray-600">
            초대 코드를 입력하여 그룹에 참여하세요.
          </p>
          
          <div>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="초대 코드 입력"
              className="w-full px-4 py-3 font-mono text-lg tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              maxLength={10}
            />
          </div>

          <button
            type="submit"
            disabled={inviteCode.length !== 10}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            참여하기
          </button>
        </form>
      </div>
    </div>
  );
} 