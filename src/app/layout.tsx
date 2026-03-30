import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "술방책방 — 술 마시는 책방 지도",
  description: "전국 북바를 지도에서 찾고, 나만의 맞춤형 아지트를 찾는 길라잡이",
  openGraph: {
    title: "술방책방 — 술 마시는 책방 지도",
    description: "전국 북바를 지도에서 찾고, 나만의 맞춤형 아지트를 찾는 길라잡이",
    url: "https://bookjan42.vercel.app",
    siteName: "술방책방",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-dvh flex-col">
          <Header />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
