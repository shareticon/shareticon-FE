// API 베이스 URL 설정
export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 개발 환경일 때 프록시 사용
    return process.env.NODE_ENV === 'development' ? '/api' : 'https://api.shareticon.site';
  }
  // 서버 사이드에서는 항상 직접 API 서버 호출
  return 'https://api.shareticon.site';
};

// API URL을 생성하는 헬퍼 함수
export const createApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}; 