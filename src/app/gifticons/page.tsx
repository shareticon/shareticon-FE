'use client';

import GifticonGrid from '@/components/GifticonGrid';

// 임시 데이터
const mockGifticons = [
  {
    id: '1',
    imageUrl: 'https://via.placeholder.com/300',
    name: '스타벅스 아메리카노',
    expiryDate: '2024-12-31',
  },
  {
    id: '2',
    imageUrl: 'https://via.placeholder.com/300',
    name: '배스킨라빈스 파인트',
    expiryDate: '2024-11-30',
  },
  {
    id: '3',
    imageUrl: 'https://via.placeholder.com/300',
    name: '교촌치킨 순살',
    expiryDate: '2024-10-31',
  },
];

export default function GifticonsPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <header className="sticky top-0 bg-white z-10 p-4 border-b">
        <h1 className="text-2xl font-bold">나의 기프티콘</h1>
      </header>
      <GifticonGrid gifticons={mockGifticons} />
    </div>
  );
} 