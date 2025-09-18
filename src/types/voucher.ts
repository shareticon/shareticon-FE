export type VoucherStatus = 'AVAILABLE' | 'USED' | 'EXPIRED';
export type SortOrder = 'asc' | 'desc';

export interface VoucherFilterCondition {
  voucherStatuses?: VoucherStatus[];
  startDay?: string; // YYYY-MM-DD format
  endDay?: string;   // YYYY-MM-DD format
}

// 백엔드 기본값과 일치하는 필터 조건 생성 함수
export const createDefaultFilterCondition = (): VoucherFilterCondition => {
  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  
  return {
    voucherStatuses: ['AVAILABLE', 'USED'], // 기본값: 사용가능 + 사용완료
    startDay: today.toISOString().split('T')[0], // 오늘
    endDay: thirtyDaysLater.toISOString().split('T')[0], // 30일 후
  };
};

export const DEFAULT_FILTER_CONDITION: VoucherFilterCondition = createDefaultFilterCondition();
