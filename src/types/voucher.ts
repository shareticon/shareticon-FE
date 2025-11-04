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
  // 백엔드 로직과 동일: plusMonths(1).with(TemporalAdjusters.lastDayOfMonth())
  // 다음 달의 마지막 날 (로컬 시간대 기준)
  const nextMonthLastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  
  // 로컬 시간대 기준으로 날짜 문자열 생성
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  return {
    voucherStatuses: ['AVAILABLE', 'USED'], // 기본값: 사용가능 + 사용완료
    startDay: formatLocalDate(today), // 오늘
    endDay: formatLocalDate(nextMonthLastDay), // 다음 달 마지막 날
  };
};

export const DEFAULT_FILTER_CONDITION: VoucherFilterCondition = createDefaultFilterCondition();
