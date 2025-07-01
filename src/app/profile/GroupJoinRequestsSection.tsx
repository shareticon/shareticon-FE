import React, { useEffect } from 'react';
import GroupJoinRequests from '@/components/GroupJoinRequests';
import { useNewGroupJoinRequest } from '@/context/NewGroupJoinRequestContext';

// 실제로는 props로 isGroupOwner를 받아야 함. 여기선 더미 true
const isGroupOwner = true;

const GroupJoinRequestsSection: React.FC = () => {
  const { setHasNew } = useNewGroupJoinRequest();
  useEffect(() => {
    setHasNew();
  }, [setHasNew]);

  if (!isGroupOwner) return null;
  return <GroupJoinRequests />;
};

export default GroupJoinRequestsSection; 