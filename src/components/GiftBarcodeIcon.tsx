import React from "react";

export default function GiftBarcodeIcon({ size = 56, color = "#3730A3" }) {
  // size: 아이콘 높이
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* 티켓(양쪽 둥근 직사각형) */}
      <rect x="8" y="18" width="40" height="20" rx="6" fill={color} />
      {/* 바코드 3줄 */}
      <rect x="18" y="24" width="3" height="8" rx="1.5" fill="#fff" />
      <rect x="26" y="22" width="3" height="12" rx="1.5" fill="#fff" />
      <rect x="34" y="24" width="3" height="8" rx="1.5" fill="#fff" />
      {/* 리본 곡선(선물 느낌) */}
      <path
        d="M16 18 Q28 6 40 18"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
} 