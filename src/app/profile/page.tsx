'use client';

import { PencilSquareIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { removeAccessToken } from '@/utils/auth';
import EditUserNicknameModal from '@/components/EditUserNicknameModal';
import ErrorDisplay from '@/components/ErrorDisplay';

interface UserProfile {
  userId: number;
  nickName: string;
  email: string;
  joinGroupCount: number;
  ownedVoucherCount: number;
}

export default function ProfilePage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      const authHeader = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
      if (!token) {
        router.push('/login');
        return;
      }
      
      const response = await fetch('https://api.shareticon.site/profile', {
        headers: {
          'Authorization': authHeader,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('프로필 정보를 불러오지 못했습니다.');
      }
      
      const data = await response.json();
      setUser(data);
    } catch (e) {
      console.error('프로필 정보 조회 실패:', e);
      setError(e instanceof Error ? e.message : '프로필 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('https://api.shareticon.site/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        },
      });

      if (response.ok) {
        removeAccessToken();
        router.push('/login');
      } else {
        if (response.status === 401) {
          removeAccessToken();
          router.push('/login');
          return;
        }
        throw new Error(`로그아웃 실패: ${response.status}`);
      }
    } catch (error: unknown) {
      console.error('로그아웃 에러:', error);
      alert('로그아웃 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleEditNickname = async (newNickname: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const authHeader = token?.startsWith('Bearer ') ? token : `Bearer ${token}`;
      const response = await fetch('https://api.shareticon.site/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ newNickname: newNickname }),
      });
      if (!response.ok) throw new Error('닉네임 변경 실패');
      setUser((prev: UserProfile | null) => prev ? { ...prev, nickName: newNickname } : null);
    } catch {
      console.error('닉네임 수정 실패');
      throw new Error('닉네임 수정 실패');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        title="프로필을 불러올 수 없어요"
        onRetry={fetchProfile}
        retryText="다시 불러오기"
        backLink="/"
        backText="홈으로 돌아가기"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-2xl">
        <header className="sticky top-0 bg-gray-50 z-10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">내 프로필</h1>
              <p className="text-sm text-gray-600 mt-1">
                프로필 정보를 확인하고 관리하세요
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="로그아웃"
              >
                <ArrowRightOnRectangleIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
        <div className="p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-6">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-semibold text-indigo-900 ml-10">{user ? user.nickName : '-'}</h2>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="닉네임 수정"
                    >
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mt-1">{user ? user.email : '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">가입한 그룹</p>
                  <p className="text-2xl font-semibold text-indigo-900 mt-1">{user ? user.joinGroupCount : '-'}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">내가 등록한 기프티콘</p>
                  <p className="text-2xl font-semibold text-indigo-900 mt-1">{user ? user.ownedVoucherCount : '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user && (
          <EditUserNicknameModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSubmit={handleEditNickname}
            currentNickname={user.nickName}
          />
        )}
      </div>
    </div>
  );
} 