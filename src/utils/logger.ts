// 환경별 로깅 유틸리티

/**
 * 현재 환경이 개발 환경인지 확인
 */
export const isDevelopment = (): boolean => {
  return process.env.NEXT_PUBLIC_ENV === 'development' || process.env.NODE_ENV === 'development';
};

/**
 * 개발 환경에서만 콘솔 로그를 출력하는 로거
 */
export const logger = {
  /**
   * 개발 환경에서만 일반 로그 출력
   */
  log: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },

  /**
   * 개발 환경에서만 에러 로그 출력
   */
  error: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.error(...args);
    }
  },

  /**
   * 개발 환경에서만 경고 로그 출력
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },

  /**
   * 개발 환경에서만 정보 로그 출력
   */
  info: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },

  /**
   * 개발 환경에서만 디버그 로그 출력
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.debug(...args);
    }
  },
};

/**
 * 환경에 관계없이 항상 로그를 출력하는 로거 (중요한 에러 등)
 */
export const forceLogger = {
  log: (...args: unknown[]) => console.log(...args),
  error: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  info: (...args: unknown[]) => console.info(...args),
  debug: (...args: unknown[]) => console.debug(...args),
};
