/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['placehold.co', 'shareticon.s3.ap-northeast-2.amazonaws.com'],
  },
  
  // 빌드 캐시 문제 해결을 위한 설정
  experimental: {
    // 증분 캐시 비활성화 (개발 환경에서 안정성 향상)
    isrMemoryCacheSize: 0,
  },
  
  // 웹팩 설정 최적화
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 개발 환경에서 캐시 안정성 개선
      config.cache = {
        type: 'memory',
        maxGenerations: 1,
      };
      
      // HMR 안정성 향상
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    
    return config;
  },
  
  // 개발 서버 설정
  onDemandEntries: {
    // 페이지를 메모리에 유지하는 시간 (ms)
    maxInactiveAge: 25 * 1000,
    // 동시에 유지할 페이지 수
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig 