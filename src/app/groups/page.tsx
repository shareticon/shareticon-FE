'use client';

import GroupList from '@/components/GroupList';
import JoinGroupModal from '@/components/JoinGroupModal';
import { PlusIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { GroupListResponse } from '@/types/group';
import { fetchWithToken } from '@/utils/auth';
import EditGroupNameModal from '@/components/EditGroupNameModal';
import ErrorDisplay from '@/components/ErrorDisplay';
import { createApiUrl } from '@/utils/api';
import ProtectedRoute from '@/components/ProtectedRoute';

function GroupsPageContent() {
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [groups, setGroups] = useState<GroupListResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupListResponse | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccessMessage, setJoinSuccessMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

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

  const handleJoinSubmit = async (code: string) => {
    try {
      setIsJoining(true);
      setJoinError(null);
      setJoinSuccessMessage(null);
      

      
      const response = await fetchWithToken(createApiUrl('/group/join'), {
        method: 'POST',
        body: JSON.stringify({
          inviteCode: code
        }),
      });



      if (!response.ok) {
        const errorData = await response.text();
        console.error('그룹 참여 에러 응답:', errorData);
        
        // 백엔드에서 온 에러 메시지 파싱 시도
        let errorMessage = '그룹 참여에 실패했습니다.';
        
        try {
          // JSON 응답인 경우 파싱
          const errorJson = JSON.parse(errorData);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {

          // JSON이 아니면 텍스트 그대로 사용
          if (errorData && errorData.trim()) {
            errorMessage = errorData;
          }
        }
        

        
        // 에러 메시지를 그대로 사용
        throw new Error(errorMessage);
      }

      // 응답 body가 있는지 확인 후 JSON 파싱
      const responseText = await response.text();
      
      if (responseText.trim()) {
        try {
          JSON.parse(responseText);
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
      
      // 성공 메시지 표시
      setJoinSuccessMessage('그룹 가입 신청이 완료되었습니다! 승인을 기다려주세요.');
      
      // 그룹 목록 새로고침
      await fetchGroups();
      
      // 2초 후 모달 자동 닫기
      setTimeout(() => {
        setIsJoinModalOpen(false);
        setJoinSuccessMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error('그룹 참여 실패:', error);
      setJoinError(error instanceof Error ? error.message : '그룹 참여 중 오류가 발생했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleEditGroupName = async (newName: string) => {
    if (!selectedGroup) return;

    try {
      const token = localStorage.getItem('accessToken');

      const response = await fetch(createApiUrl(`/group/${selectedGroup.groupId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token?.startsWith('Bearer ') ? token : `Bearer ${token}`
        },
        body: JSON.stringify({
          newGroupTitleAlias: newName
        })
      });

      if (!response.ok) {
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
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-[#1F2B88]">그룹 목록</h1>
                <p className="text-sm text-gray-600 mt-1">그룹에 참여하여 기프티콘을 공유해 보세요</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsJoinModalOpen(true);
                    setJoinError(null);
                    setJoinSuccessMessage(null);
                  }}
                  className="inline-flex items-center text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
                  title="그룹 참여하기"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  <span className="ml-1 hidden sm:inline">참여하기</span>
                </button>
                <Link
                  href="/groups/create"
                  className="inline-flex items-center bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  title="새 그룹 만들기"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="ml-1 hidden sm:inline">새 그룹</span>
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
                  onClick={() => {
                    setIsJoinModalOpen(true);
                    setJoinError(null);
                    setJoinSuccessMessage(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  참여하기
                </button>
                <span className="text-gray-400">또는</span>
                <Link
                  href="/groups/create"
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  새 그룹
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
          onClose={() => {
            setIsJoinModalOpen(false);
            setJoinError(null);
            setJoinSuccessMessage(null);
          }}
          onSubmit={handleJoinSubmit}
          error={joinError}
          successMessage={joinSuccessMessage}
          isLoading={isJoining}
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

export default function GroupsPage() {
  return (
    <ProtectedRoute>
      <GroupsPageContent />
    </ProtectedRoute>
  );
} 