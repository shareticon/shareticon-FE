'use client';

import GroupList from '@/components/GroupList';
import JoinGroupModal from '@/components/JoinGroupModal';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GroupListResponse } from '@/types/group';
import { fetchWithToken } from '@/utils/auth';
import EditGroupNameModal from '@/components/EditGroupNameModal';
import { useRouter } from 'next/navigation';
import ErrorDisplay from '@/components/ErrorDisplay';
import { createApiUrl } from '@/utils/api';

export default function GroupsPage() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupListResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchWithToken(createApiUrl('/group'));
      
      if (!response.ok) {
        throw new Error('그룹 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setGroups(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSubmit = (code: string) => {
    // TODO: API 연동 후 실제 그룹 참여 로직 구현
    console.log('참여 코드:', code);
    setIsJoinModalOpen(false);
  };

  const handleEditGroupName = async (newName: string) => {
    if (!selectedGroup) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(createApiUrl(`/group/${selectedGroup.groupId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({
          newGroupTitleAlias: newName
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('그룹명 수정에 실패했습니다.');
      }

      // 성공 시 그룹 목록 업데이트
      setGroups(groups.map(group => 
        group.groupId === selectedGroup.groupId
          ? { ...group, groupTitleAlias: newName }
          : group
      ));

      // 모달 닫기
      setIsEditModalOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      console.error('그룹명 수정 실패:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">그룹 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        title="그룹 목록을 불러올 수 없어요"
        onRetry={fetchGroups}
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
          <div className="flex flex-col">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-[#1F2B88]">그룹 목록</h1>
                <p className="text-sm text-gray-600 mt-1">함께 사용하는 기프티콘을 그룹으로 관리하세요</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="inline-flex items-center border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <UserPlusIcon className="w-5 h-5 mr-1" />
                  <span>참여하기</span>
                </button>
                <Link
                  href="/groups/create"
                  className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-1" />
                  <span>새 그룹</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4">
          {groups.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <p className="text-gray-600 mb-4">아직 참여 중인 그룹이 없습니다.</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setIsJoinModalOpen(true)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  그룹 참여하기
                </button>
                <span className="text-gray-400">또는</span>
                <Link
                  href="/groups/create"
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  새 그룹 만들기
                </Link>
              </div>
            </div>
          ) : (
            <GroupList 
              groups={groups} 
              onEditClick={(group) => {
                setSelectedGroup(group);
                setIsEditModalOpen(true);
              }}
            />
          )}
        </div>

        <JoinGroupModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSubmit={handleJoinSubmit}
        />

        {selectedGroup && (
          <EditGroupNameModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedGroup(null);
            }}
            onSubmit={handleEditGroupName}
            currentName={selectedGroup.groupTitleAlias}
          />
        )}
      </div>
    </div>
  );
} 