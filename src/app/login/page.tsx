'use client';
import type { CSSProperties } from 'react';
import Image from 'next/image';

// 떠다니는 애니메이션 스타일
const floatAnimation = `
@keyframes float1 {
  0%, 100% { transform: translateY(0px) rotate(var(--rotate)); }
  50% { transform: translateY(-8px) rotate(var(--rotate)); }
}
@keyframes float2 {
  0%, 100% { transform: translateY(0px) rotate(var(--rotate)); }
  50% { transform: translateY(-12px) rotate(var(--rotate)); }
}
@keyframes float3 {
  0%, 100% { transform: translateY(-5px) rotate(var(--rotate)); }
  50% { transform: translateY(5px) rotate(var(--rotate)); }
}
`;

// 선물 상자 SVG 컴포넌트
const GiftBox = ({ className, color = 'coral' }: { className?: string; color?: 'coral' | 'mint' | 'lavender' | 'gold' }) => {
  const colors = {
    coral: { box: '#FF8A80', boxDark: '#E57373', ribbon: '#FFD54F', ribbonDark: '#FFC107' },
    mint: { box: '#80CBC4', boxDark: '#4DB6AC', ribbon: '#F48FB1', ribbonDark: '#EC407A' },
    lavender: { box: '#B39DDB', boxDark: '#9575CD', ribbon: '#81D4FA', ribbonDark: '#4FC3F7' },
    gold: { box: '#FFE082', boxDark: '#FFD54F', ribbon: '#EF5350', ribbonDark: '#E53935' },
  };
  const c = colors[color];
  
  return (
    <svg viewBox="0 0 80 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 상자 몸체 */}
      <rect x="10" y="35" width="60" height="40" rx="4" fill={c.box} />
      <rect x="10" y="35" width="60" height="40" rx="4" fill="url(#boxGradient)" />
      
      {/* 상자 몸체 하이라이트 */}
      <rect x="12" y="37" width="25" height="36" rx="2" fill="white" fillOpacity="0.15" />
      
      {/* 상자 뚜껑 */}
      <rect x="6" y="25" width="68" height="14" rx="3" fill={c.boxDark} />
      <rect x="8" y="27" width="30" height="8" rx="2" fill="white" fillOpacity="0.2" />
      
      {/* 세로 리본 */}
      <rect x="35" y="25" width="10" height="50" fill={c.ribbon} />
      <rect x="36" y="25" width="3" height="50" fill="white" fillOpacity="0.3" />
      
      {/* 가로 리본 */}
      <rect x="6" y="29" width="68" height="6" fill={c.ribbon} />
      <rect x="6" y="30" width="68" height="2" fill="white" fillOpacity="0.3" />
      
      {/* 리본 매듭 */}
      <ellipse cx="40" cy="22" rx="8" ry="6" fill={c.ribbonDark} />
      <ellipse cx="40" cy="21" rx="6" ry="4" fill={c.ribbon} />
      
      {/* 리본 루프 왼쪽 */}
      <path d="M32 22C32 22 28 14 22 16C16 18 18 26 24 28C30 30 32 24 32 22Z" fill={c.ribbon} />
      <path d="M31 21C31 21 28 16 24 17C20 18 21 23 25 25" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      
      {/* 리본 루프 오른쪽 */}
      <path d="M48 22C48 22 52 14 58 16C64 18 62 26 56 28C50 30 48 24 48 22Z" fill={c.ribbon} />
      <path d="M49 21C49 21 52 16 56 17C60 18 59 23 55 25" stroke="white" strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      
      <defs>
        <linearGradient id="boxGradient" x1="10" y1="35" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="black" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// 티켓 SVG 컴포넌트
const Ticket = ({ className, color = 'blue' }: { className?: string; color?: 'blue' | 'pink' | 'orange' | 'teal' }) => {
  const colors = {
    blue: { bg: '#90CAF9', bgDark: '#64B5F6', accent: '#1976D2', star: '#FDD835' },
    pink: { bg: '#F8BBD9', bgDark: '#F48FB1', accent: '#D81B60', star: '#FFB74D' },
    orange: { bg: '#FFCC80', bgDark: '#FFB74D', accent: '#E65100', star: '#EF5350' },
    teal: { bg: '#80DEEA', bgDark: '#4DD0E1', accent: '#00838F', star: '#AB47BC' },
  };
  const c = colors[color];
  
  return (
    <svg viewBox="0 0 100 50" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 티켓 배경 - 왼쪽 부분 */}
      <path d="M4 8C4 5.79086 5.79086 4 8 4H62V46H8C5.79086 46 4 44.2091 4 42V8Z" fill={c.bg} />
      
      {/* 티켓 배경 - 오른쪽 부분 (스텁) */}
      <path d="M68 4H92C94.2091 4 96 5.79086 96 8V42C96 44.2091 94.2091 46 92 46H68V4Z" fill={c.bgDark} />
      
      {/* 가운데 점선 구분 */}
      <line x1="65" y1="4" x2="65" y2="10" stroke={c.accent} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="65" y1="14" x2="65" y2="22" stroke={c.accent} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="65" y1="26" x2="65" y2="34" stroke={c.accent} strokeWidth="2" strokeDasharray="3 3" />
      <line x1="65" y1="38" x2="65" y2="46" stroke={c.accent} strokeWidth="2" strokeDasharray="3 3" />
      
      {/* 왼쪽 홈 */}
      <circle cx="4" cy="25" r="6" fill="white" />
      
      {/* 오른쪽 홈 */}
      <circle cx="96" cy="25" r="6" fill="white" />
      
      {/* 장식 - 별 */}
      <path d="M20 18L21.5 22L26 22.5L23 25.5L24 30L20 27.5L16 30L17 25.5L14 22.5L18.5 22L20 18Z" fill={c.star} />
      
      {/* 장식 - 라인들 */}
      <rect x="30" y="16" width="24" height="3" rx="1.5" fill={c.accent} fillOpacity="0.4" />
      <rect x="30" y="23" width="18" height="2" rx="1" fill={c.accent} fillOpacity="0.25" />
      <rect x="30" y="29" width="22" height="2" rx="1" fill={c.accent} fillOpacity="0.25" />
      
      {/* 스텁 텍스트 영역 */}
      <rect x="72" y="18" width="18" height="3" rx="1.5" fill={c.accent} fillOpacity="0.3" />
      <rect x="74" y="26" width="14" height="2" rx="1" fill={c.accent} fillOpacity="0.2" />
      
      {/* 하이라이트 */}
      <rect x="6" y="6" width="20" height="4" rx="2" fill="white" fillOpacity="0.3" />
    </svg>
  );
};

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const env = process.env.NEXT_PUBLIC_ENV;
    let kakaoLoginUrl: string;
    
    if (env === 'development' || window.location.hostname === 'localhost') {
      kakaoLoginUrl = 'http://localhost:8080/login/oauth2/code/kakao';
    } else {
      kakaoLoginUrl = 'https://api.shareticon.site/login/oauth2/code/kakao';
    }
    
    window.location.href = kakaoLoginUrl;
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center px-6 pb-10 relative"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fef9e7 30%, #f0fdf4 70%, #f8fafc 100%)'
      }}
    >
      {/* 떠다니는 애니메이션 스타일 삽입 */}
      <style>{floatAnimation}</style>
      
      {/* 배경 장식 요소들 - SVG 선물상자와 티켓 (6개, 떠다니는 효과) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 선물상자 1 */}
        <div 
          className="absolute top-[6%] left-[18%]"
          style={{ 
            '--rotate': '15deg',
            animation: 'float1 4s ease-in-out infinite',
          } as CSSProperties}
        >
          <GiftBox className="w-14 h-14 opacity-18" color="coral" />
        </div>
        
        {/* 티켓 1 */}
        <div 
          className="absolute top-[14%] right-[5%]"
          style={{ 
            '--rotate': '-22deg',
            animation: 'float2 5s ease-in-out infinite 0.5s',
          } as CSSProperties}
        >
          <Ticket className="w-16 h-8 opacity-15" color="blue" />
        </div>
        
        {/* 선물상자 2 */}
        <div 
          className="absolute top-[42%] left-[3%]"
          style={{ 
            '--rotate': '-12deg',
            animation: 'float3 4.5s ease-in-out infinite 1s',
          } as CSSProperties}
        >
          <GiftBox className="w-11 h-11 opacity-14" color="mint" />
        </div>
        
        {/* 티켓 2 (pink) */}
        <div 
          className="absolute top-[calc(55%-20px)] right-[15%]"
          style={{ 
            '--rotate': '8deg',
            animation: 'float1 5.5s ease-in-out infinite 0.3s',
          } as CSSProperties}
        >
          <Ticket className="w-14 h-7 opacity-16" color="pink" />
        </div>
        
        {/* 선물상자 3 */}
        <div 
          className="absolute bottom-[18%] right-[6%]"
          style={{ 
            '--rotate': '25deg',
            animation: 'float2 4s ease-in-out infinite 0.8s',
          } as CSSProperties}
        >
          <GiftBox className="w-12 h-12 opacity-17" color="lavender" />
        </div>
        
        {/* 티켓 3 */}
        <div 
          className="absolute bottom-[8%] left-[22%]"
          style={{ 
            '--rotate': '-5deg',
            animation: 'float3 5s ease-in-out infinite 1.2s',
          } as CSSProperties}
        >
          <Ticket className="w-15 h-7 opacity-14" color="teal" />
        </div>
      </div>

      {/* Header & Slogan - 첫 번째 그룹 */}
      <div className="w-full flex justify-center mt-[22vh] animate-fade-slide-1 relative z-10">
        <div className="inline-block flex flex-col text-center">
          <div className="flex flex-col" style={{ width: 'fit-content', margin: '0 auto' }}>
            <h1 className="text-amber-900 text-6xl font-extrabold leading-none text-center font-poppins" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
              Shareticon
            </h1>
          </div>
          {/* Slogan */}
          <div className="mt-4 mb-4">
            <p className="text-amber-800 text-lg font-medium text-center font-ibm-plex-sans-kr">
              기프티콘 관리부터 공유까지 함께해요
            </p>
          </div>
        </div>
      </div>

      {/* Spacer - 여백 줄임 */}
      <div className="flex-grow-0 h-8"></div>

      {/* Character Illustration and Login Button Container - 두 번째 그룹 */}
      <div className="w-full flex flex-col items-center mt-[60px] animate-fade-slide-2 relative z-10">
        {/* Character Illustration - 뒤쪽 레이어 */}
        <div className="w-[300px] h-[300px] flex items-center justify-center ml-[15px] relative z-10">
          <Image 
            src="/images/cat-character.svg" 
            alt="Shareticon Cat Character" 
            width={300}
            height={300}
            className="w-full h-full object-contain drop-shadow-lg"
            priority
          />
        </div>
        {/* Kakao Login Button - 앞쪽 레이어 */}
        <div className="w-full max-w-xs -mt-10 relative z-20">
          <button 
            onClick={handleKakaoLogin}
            className="w-full py-4 bg-[#FEE500] text-black font-bold rounded-lg text-center text-base mb-4 shadow-[0_4px_12px_rgba(217,119,6,0.2),0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_16px_rgba(217,119,6,0.3),0_4px_8px_rgba(0,0,0,0.15)] transition-all duration-200"
          >
            카카오로 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
