'use client';

import Image from 'next/image';

interface Gifticon {
  id: string;
  imageUrl: string;
  name: string;
  expiryDate: string;
}

interface GifticonGridProps {
  gifticons: Gifticon[];
}

export default function GifticonGrid({ gifticons }: GifticonGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {gifticons.map((gifticon) => (
        <div
          key={gifticon.id}
          className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white"
        >
          <Image
            src={gifticon.imageUrl}
            alt={gifticon.name}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-3">
            <p className="text-sm font-medium truncate">{gifticon.name}</p>
            <p className="text-xs opacity-90">유효기간: {gifticon.expiryDate}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 