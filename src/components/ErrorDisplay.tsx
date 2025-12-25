'use client';

import Link from 'next/link';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  retryText?: string;
  backLink?: string;
  backText?: string;
  showReload?: boolean;
}

export default function ErrorDisplay({
  error,
  title = "문제가 발생했어요",
  onRetry,
  retryText = "다시 시도하기",
  backLink,
  backText = "돌아가기",
  showReload = true
}: ErrorDisplayProps) {
  
  const getErrorMessage = (errorString: string) => {
    if (errorString.includes('Failed to fetch') || errorString.includes('fetch')) {
      return '서버와 연결할 수 없어요.\n인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.';
    }
    if (errorString.includes('401') || errorString.includes('인증')) {
      return '로그인이 필요하거나 로그인이 만료되었어요.\n다시 로그인해주세요.';
    }
    if (errorString.includes('403') || errorString.includes('권한')) {
      return '이 페이지에 접근할 권한이 없어요.';
    }
    if (errorString.includes('404')) {
      return '요청하신 페이지나 정보를 찾을 수 없어요.';
    }
    if (errorString.includes('500')) {
      return '서버에 일시적인 문제가 발생했어요.\n잠시 후 다시 시도해주세요.';
    }
    return '예상치 못한 문제가 발생했어요.\n잠시 후 다시 시도해주세요.';
  };

  const getErrorIcon = (errorString: string) => {
    if (errorString.includes('Failed to fetch') || errorString.includes('fetch')) {
      // 네트워크 에러 아이콘 (WiFi 끊김)
      return (
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
        </svg>
      );
    }
    if (errorString.includes('401') || errorString.includes('403')) {
      // 권한 에러 아이콘
      return (
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      );
    }
    if (errorString.includes('404')) {
      // 404 에러 아이콘 (페이지 찾을 수 없음)
      return (
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.01-6-2.709M15 13.5a4.5 4.5 0 11-6 0 4.5 4.5 0 016 0z" />
        </svg>
      );
    }
    // 기본 에러 아이콘
    return (
      <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center border border-stone-200/60">
          {/* 에러 아이콘 */}
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            {getErrorIcon(error)}
          </div>

          {/* 에러 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h2>

          {/* 에러 메시지 */}
          <p className="text-gray-600 mb-2 leading-relaxed whitespace-pre-line">
            {getErrorMessage(error)}
          </p>

          {/* 기술적 에러 메시지 (개발 환경에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 mb-6">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                기술적 세부사항
              </summary>
              <p className="text-xs text-gray-400 mt-2 bg-gray-50 p-3 rounded-lg text-left font-mono">
                {error}
              </p>
            </details>
          )}

          {/* 액션 버튼들 */}
          <div className="flex flex-col gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-sm"
              >
                {retryText}
              </button>
            )}
            
            {backLink && (
              <Link
                href={backLink}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {backText}
              </Link>
            )}
          </div>

          {/* 도움말 링크 */}
          {showReload && (
            <p className="text-sm text-gray-500 mt-6">
              문제가 계속되면{' '}
              <button 
                onClick={() => window.location.reload()}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                페이지 새로고침
              </button>
              을 시도해보세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 