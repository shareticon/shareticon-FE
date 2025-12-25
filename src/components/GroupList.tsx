'use client';

import { UsersIcon, PencilSquareIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import { GroupListResponse } from '@/types/group';
import Link from 'next/link';

interface GroupListProps {
  groups: GroupListResponse[];
  onEditClick?: (group: GroupListResponse) => void;
}

export default function GroupList({ groups, onEditClick }: GroupListProps) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Link
          key={group.groupId}
          href={`/groups/${group.groupId}`}
          className="block bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-amber-200/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-amber-600">
                <QrCodeIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-stone-800">{group.groupTitleAlias}</h3>
                  {onEditClick && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onEditClick(group);
                      }}
                      className="p-1 text-gray-400 hover:text-amber-600 rounded-lg transition-colors"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {group.groupTitleAlias}와 함께 사용하는 기프티콘
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{group.memberCount}명</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 