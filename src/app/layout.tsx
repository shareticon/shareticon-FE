import type { Metadata } from "next";
import { Inter, Poppins, Noto_Sans_KR, IBM_Plex_Sans_KR } from "next/font/google";
import "./globals.css";
import ConditionalBottomNav from "@/components/ConditionalBottomNav";
import { NewGroupJoinRequestProvider } from '@/context/NewGroupJoinRequestContext';
import { ToastProvider } from '@/contexts/ToastContext';

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
});
const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-noto-sans-kr"
});
const ibmPlexSansKR = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans-kr"
});

export const metadata: Metadata = {
  title: "Shareticon",
  description: "가족이나 친구들과 함께 기프티콘을 공유하는 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} ${poppins.variable} ${notoSansKR.variable} ${ibmPlexSansKR.variable}`}>
        <ToastProvider>
          <NewGroupJoinRequestProvider>
            <main className="pb-16">
              {children}
            </main>
            <ConditionalBottomNav />
          </NewGroupJoinRequestProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
