'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// 기프티콘 에러 아이콘 컴포넌트
const ErrorGifticonIcon = () => {
  return (
    <div className="mb-8">
      <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        {/* 느낌표 아이콘 */}
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
    </div>
  );
};

// 네트워크 에러 아이콘 컴포넌트
const NetworkErrorIcon = () => {
  return (
    <div className="mb-8">
      <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        {/* WiFi 끊김 아이콘 */}
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </svg>
      </div>
    </div>
  );
};

// 일반 에러 페이지
interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
}

export const GeneralErrorPage = ({ 
  title = "앗, 문제가 발생했어요",
  message = "예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = true
}: ErrorPageProps) => {
  const router = useRouter();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.push('/');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  // 에러 페이지가 마운트될 때 body에 클래스 추가
  React.useEffect(() => {
    document.body.classList.add('error-page-active');
    return () => {
      document.body.classList.remove('error-page-active');
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center px-4 z-[60]">
      <div className="max-w-md w-full text-center">
        <ErrorGifticonIcon />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="space-y-3">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              다시 시도하기
            </button>
          )}
          
          {showHome && (
            <button
              onClick={handleGoHome}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
            >
              홈으로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 네트워크 에러 페이지
export const NetworkErrorPage = ({
  title = "연결에 문제가 있어요",
  message = "인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.",
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = true
}: ErrorPageProps) => {
  const router = useRouter();

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      router.push('/');
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  // 에러 페이지가 마운트될 때 body에 클래스 추가
  React.useEffect(() => {
    document.body.classList.add('error-page-active');
    return () => {
      document.body.classList.remove('error-page-active');
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center px-4 z-[60]">
      <div className="max-w-md w-full text-center">
        <NetworkErrorIcon />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {title}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="space-y-3">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="w-full py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              다시 연결하기
            </button>
          )}
          
          {showHome && (
            <button
              onClick={handleGoHome}
              className="w-full py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
            >
              홈으로 돌아가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// 인증 에러 페이지
export const AuthErrorPage = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  // 에러 페이지가 마운트될 때 body에 클래스 추가
  React.useEffect(() => {
    document.body.classList.add('error-page-active');
    return () => {
      document.body.classList.remove('error-page-active');
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center px-4 z-[60]">
      <div className="max-w-md w-full text-center">
        {/* 자물쇠 아이콘 */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          로그인이 필요해요
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          이 페이지를 보려면 먼저 로그인해주세요.
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  );
};

export default GeneralErrorPage;
