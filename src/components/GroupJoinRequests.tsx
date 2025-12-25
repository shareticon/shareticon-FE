import React, { useState, useEffect } from 'react';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { fetchWithToken, getAccessToken } from '@/utils/auth';
import { createApiUrl } from '@/utils/api';
import { logger } from '@/utils/logger';

interface JoinRequest {
  applyUserId: number;
  applyUserNickname: string;
  isNew?: boolean;
}

interface GroupRequest {
  targetGroupId: number;
  leaderGroupAlias: string;
  pendingMembers: JoinRequest[];
}

const GroupJoinRequests: React.FC = () => {
  const [groupRequests, setGroupRequests] = useState<GroupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      // 토큰이 없으면 API 호출하지 않음 (ProtectedRoute가 인증을 보장)
      const token = getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithToken(createApiUrl('/group/join'));
        if (!response.ok) {
          throw new Error('가입 신청 내역을 불러오지 못했습니다.');
        }
        const data = await response.json();
        
        // 마지막으로 확인한 신청 목록 가져오기
        const lastCheckedRequests = JSON.parse(localStorage.getItem('lastCheckedGroupRequests') || '[]');

        
        // 새로운 신청에 isNew 표식 추가
        const processedData = data.map((group: GroupRequest) => ({
          ...group,
          pendingMembers: group.pendingMembers.map(member => {
            const isNew = !lastCheckedRequests.includes(member.applyUserId);

            return {
              ...member,
              isNew
            };
          })
        }));
        
        setGroupRequests(processedData);
        
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        
        // 네트워크 에러인 경우 조용히 실패 (홈 페이지에서는 이 컴포넌트 에러로 전체가 망가지지 않도록)
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          logger.log('GroupJoinRequests: 서버 연결 실패, 조용히 무시');
          setGroupRequests([]);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // 컴포넌트가 마운트되고 데이터가 로드된 후 자동으로 확인 처리
  useEffect(() => {
    if (!loading && groupRequests.length > 0) {
      // 현재 모든 신청 ID를 localStorage에 저장 (자동 확인 처리)
      const currentRequestIds = groupRequests.flatMap(group =>
        group.pendingMembers.map(member => member.applyUserId)
      );
      
      // 2초 후에 자동으로 확인 처리 (사용자가 NEW를 볼 시간을 줌)
      const timer = setTimeout(() => {
        localStorage.setItem('lastCheckedGroupRequests', JSON.stringify(currentRequestIds));

      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, groupRequests]);

  const handleAccept = async (groupId: number, userId: number) => {
    try {
      const response = await fetchWithToken(createApiUrl(`/group/${groupId}/user/${userId}?status=APPROVED`), {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('수락 처리에 실패했습니다.');
      setGroupRequests(prev => prev.map(g =>
        g.targetGroupId === groupId
          ? { ...g, pendingMembers: g.pendingMembers.filter(r => r.applyUserId !== userId) }
          : g
      ));
    } catch {
      alert('수락 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (groupId: number, userId: number) => {
    try {
      const response = await fetchWithToken(createApiUrl(`/group/${groupId}/user/${userId}?status=REJECTED`), {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('거절 처리에 실패했습니다.');
      setGroupRequests(prev => prev.map(g =>
        g.targetGroupId === groupId
          ? { ...g, pendingMembers: g.pendingMembers.filter(r => r.applyUserId !== userId) }
          : g
      ));
    } catch {
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return null; // 로딩 중일 때 아무것도 렌더링하지 않음
  }
  
  if (error) {
    return (
      <section>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">가입 신청을 불러올 수 없어요</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </section>
    );
  }
  if (groupRequests.every(g => g.pendingMembers.length === 0)) {
    return null;
  }

  return (
    <section>
      <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <h2 className="text-xl font-semibold text-indigo-900 mb-4">그룹 가입 신청 관리</h2>
        <div className="space-y-6">
          {(() => {
            const elements = [];
            for (const group of groupRequests) {
              if (group.pendingMembers.length > 0) {
                elements.push(
                  <div key={group.targetGroupId} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-2 font-bold text-gray-800">
                      <UserGroupIcon className="w-5 h-5 text-[#3730A3]" />
                      <span>{group.leaderGroupAlias}</span>
                    </div>
                    <hr className="my-3 border-gray-200" />
                    <ul className="divide-y divide-gray-100">
                      {group.pendingMembers.map(request => (
                        <li key={request.applyUserId} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{request.applyUserNickname}</span>
                            {request.isNew && (
                              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">NEW</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(group.targetGroupId, request.applyUserId)}
                              className="px-3 py-1 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >수락</button>
                            <button
                              onClick={() => handleReject(group.targetGroupId, request.applyUserId)}
                              className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            >거절</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
            }
            return elements;
          })()}
        </div>
      </div>
    </section>
  );
};

export default GroupJoinRequests; 