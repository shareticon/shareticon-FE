// API 베이스 URL 설정
export const getApiBaseUrl = () => {
  // 환경 변수에서 API URL 가져오기 (최우선)
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // 환경 변수가 없을 때 기본값 사용 (배포 환경)
  return 'https://api.shareticon.site/api';
};

// API URL을 생성하는 헬퍼 함수
export const createApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// 현재 환경 정보 가져오기
export const getEnvironment = () => {
  return {
    env: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'production',
    apiUrl: getApiBaseUrl(),
    isLocal: process.env.NEXT_PUBLIC_ENV === 'development'
  };
}; 