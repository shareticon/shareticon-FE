'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  inviteCode: string;
}

export default function InviteModal({ isOpen, onClose, groupName, inviteCode }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-indigo-900">멤버 초대</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-600">
            아래 초대 코드를 공유하여 <strong className="text-indigo-900">{groupName}</strong> 그룹에 멤버를 초대하세요.
          </p>
          
          <div className="relative">
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 font-mono text-lg border border-gray-100">
              <span className="tracking-wider text-gray-900">{inviteCode}</span>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-colors ${
                  copied 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-blue-500 hover:bg-blue-50'
                }`}
                title="코드 복사"
              >
                {copied ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <ClipboardDocumentIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 