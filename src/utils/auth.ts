import { getApiBaseUrl } from './api';

// 액세스 토큰을 저장할 변수
let accessToken: string | null = null;

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

// 액세스 토큰 제거
export const removeAccessToken = (): void => {
  accessToken = null;
  localStorage.removeItem('accessToken');
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
      if (response.status === 401) {
        removeAccessToken();
        window.location.href = '/login';
        throw new Error('인증이 만료되었습니다.');
      }
      
      const errorText = await response.text();
      throw new Error(`토큰 재발급 실패: ${response.status} - ${errorText}`);
    }

    const newToken = response.headers.get('Authorization');
    
    if (!newToken) {
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

    // 401 에러 처리
    if (response.status === 401) {
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