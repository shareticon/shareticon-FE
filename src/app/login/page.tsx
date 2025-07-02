'use client';

import GiftBarcodeIcon from '@/components/GiftBarcodeIcon';
import { getApiBaseUrl } from '@/utils/api';

export default function LoginPage() {
  const handleKakaoLogin = () => {
    // 환경에 따른 카카오 로그인 URL 생성
    const apiBaseUrl = getApiBaseUrl();
    
    // API URL에서 베이스 도메인 추출 (예: https://api.shareticon.site/api -> https://api.shareticon.site)
    const baseUrl = apiBaseUrl.replace('/api', '');
    const kakaoLoginUrl = `${baseUrl}/login/oauth2/code/kakao`;
    
    console.log('현재 apiBaseUrl:', apiBaseUrl);
    console.log('생성된 kakaoLoginUrl:', kakaoLoginUrl);
    
    window.location.href = kakaoLoginUrl;
  };

  return (
    <div className="container mx-auto max-w-2xl min-h-screen flex flex-col" style={{ background: '#f7f8fa' }}>
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <div className="flex items-end gap-3 mb-2">
          <GiftBarcodeIcon size={56} color="#2563eb" />
          <span
            style={{
              fontWeight: 700,
              fontSize: 36,
              color: "#3730A3",
              fontFamily: "inherit",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            Shareticon
          </span>
        </div>
        <p className="text-gray-600 text-center mb-16">
          가족이나 친구들과 함께 기프티콘을 공유하고 관리하세요
        </p>

        <button
          onClick={handleKakaoLogin}
          className="w-full max-w-md bg-[#FEE500] text-[#000000] py-4 rounded-xl font-medium relative hover:bg-[#FDD800] transition-colors shadow text-lg"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C6.47715 2.25 2 5.61917 2 9.75C2 12.3458 3.75 14.6375 6.37500 15.9833L5.00001 20.1083C4.91667 20.3333 5.19167 20.5167 5.39167 20.3833L10.3 17.1083C10.8583 17.1833 11.4167 17.2167 12 17.2167C17.5228 17.2167 22 13.8458 22 9.71667C22 5.58751 17.5228 2.25 12 2.25Z" fill="black"/>
            </svg>
          </div>
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
} 