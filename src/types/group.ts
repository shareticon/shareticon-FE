import { Gifticon } from '@/types/gifticon';

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isOwner: boolean;
}

export interface GroupGifticon extends Gifticon {
  sharedBy: {
    name: string;
    id: string;
  };
}

export interface GroupListResponse {
  groupId: number;
  groupTitleAlias: string;
  memberCount: number;
} 