'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

// 임시 데이터
const mockGroupRequests = {
  '1': [
    {
      id: '1',
      userId: 'user123',
      userName: '김철수',
      requestedAt: '2024-03-20T10:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      userId: 'user456',
      userName: '이영희',
      requestedAt: '2024-03-19T15:45:00Z',
      status: 'pending'
    }
  ],
  '2': [
    {
      id: '3',
      userId: 'user789',
      userName: '박지민',
      requestedAt: '2024-03-20T09:15:00Z',
      status: 'pending'
    }
  ],
  '3': []
};

function GroupRequestsPageContent() {
  const { id } = useParams();
  const groupId = Array.isArray(id) ? id[0] : id;
  const [requests, setRequests] = useState(mockGroupRequests[groupId as keyof typeof mockGroupRequests] || []);

  const handleAccept = async (requestId: string) => {
    // TODO: API 연동 후 실제 수락 로직 구현
    console.log('수락:', requestId);
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const handleReject = async (requestId: string) => {
    // TODO: API 연동 후 실제 거절 로직 구현
    console.log('거절:', requestId);
    setRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
          <div className="flex items-center">
            <Link href={`/groups/${groupId}`} className="mr-3 shrink-0 text-gray-600 hover:text-indigo-600 transition-colors">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">가입 요청 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                새로운 멤버의 가입 요청을 관리하세요
              </p>
            </div>
          </div>
        </header>

        <div className="p-4">
          {requests.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-600">
              처리할 가입 요청이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(request => (
                <div
                  key={request.id}
                  className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-indigo-900">{request.userName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        신청일시: {formatDate(request.requestedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(request.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="수락"
                      >
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="거절"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GroupRequestsPage() {
  return (
    <ProtectedRoute>
      <GroupRequestsPageContent />
    </ProtectedRoute>
  );
} 