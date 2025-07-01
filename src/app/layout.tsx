import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { NewGroupJoinRequestProvider } from '@/context/NewGroupJoinRequestContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shareticon",
  description: "가족이나 친구들과 함께 기프티콘을 공유하는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // next/navigation의 usePathname은 클라이언트 컴포넌트에서만 사용 가능하므로, 아래처럼 처리
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ko">
      <body className={inter.className}>
        <NewGroupJoinRequestProvider>
          <main className="pb-16">
            {children}
          </main>
          {!isLoginPage && <BottomNav />}
        </NewGroupJoinRequestProvider>
      </body>
    </html>
  );
}
