import { getApiBaseUrl } from './api';

// 액세스 토큰을 저장할 변수
let accessToken: string | null = null;

// 쿠키 삭제 함수
const clearAllCookies = (): void => {
  // 현재 도메인의 모든 쿠키 삭제
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // 배포 환경을 위한 추가 쿠키 삭제
  const currentDomain = window.location.hostname;
  const domains = [currentDomain, `.${currentDomain}`];
  
  domains.forEach(domain => {
    document.cookie = `refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    document.cookie = `JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
  });
};

// 액세스 토큰 설정
export const setAccessToken = (token: string): void => {
  accessToken = token;
  localStorage.setItem('accessToken', token);
};

// 액세스 토큰 가져오기
export const getAccessToken = (): string | null => {
  if (!accessToken) {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

// 액세스 토큰 제거 (쿠키도 함께 정리)
export const removeAccessToken = (): void => {
  accessToken = null;
  localStorage.removeItem('accessToken');
  // 모든 쿠키도 정리
  clearAllCookies();
};

// 토큰 재발급 요청
export const reissueToken = async (): Promise<string> => {
  try {
    const reissueUrl = `${getApiBaseUrl()}/reissue`;
    
    const response = await fetch(reissueUrl, {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
    });

    if (!response.ok) {
      // 401 또는 403 에러 시 모든 토큰 정리 후 로그인 페이지로 이동
      if (response.status === 401 || response.status === 403) {
        console.log('리프레시 토큰이 만료되었습니다. 다시 로그인해주세요.');
        removeAccessToken();
        window.location.href = '/login';
        throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
      }
      
      const errorText = await response.text();
      console.error('토큰 재발급 실패:', response.status, errorText);
      
      // 다른 에러도 안전하게 로그인 페이지로 이동
      removeAccessToken();
      window.location.href = '/login';
      throw new Error(`토큰 재발급 실패: ${response.status} - ${errorText}`);
    }

    const newToken = response.headers.get('Authorization');
    
    if (!newToken) {
      console.error('응답 헤더에 토큰이 없습니다');
      removeAccessToken();
      window.location.href = '/login';
      throw new Error('응답 헤더에 토큰이 없습니다');
    }

    setAccessToken(newToken);
    return newToken;
  } catch (error) {
    console.error('토큰 재발급 에러:', error);
    throw error;
  }
};

// API 요청 함수
export const fetchWithToken = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAccessToken();
  
  // Authorization 헤더 설정 (Bearer 형식으로 통일)
  const authHeader = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // 항상 쿠키 포함
    });

    // 401 에러 처리 - 모든 토큰 정리 후 로그인 페이지로 이동
    if (response.status === 401) {
      console.log('인증이 만료되었습니다. 다시 로그인해주세요.');
      removeAccessToken();
      window.location.href = '/login';
      throw new Error('인증이 만료되었습니다.');
    }

    return response;
  } catch (error) {
    console.error('API 요청 에러:', error);
    throw error;
  }
}; 