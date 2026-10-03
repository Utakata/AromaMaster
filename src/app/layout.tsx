import type { Metadata, Viewport } from "next";
import { Nav } from "@/components/Nav";
import { AppDataProvider } from "@/lib/store";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://aroma.prodenz.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AromaMaster — NVC で選ぶアロマ調合", template: "%s | AromaMaster" },
  description:
    "観察・感情・ニーズ・リクエスト（NVC）から、科学的根拠のある精油を選び、リードディフューザー・ネブライザー・超音波の調合量まで具体化。在庫管理と再購入通知つき。",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#3f6b5a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <AppDataProvider>
          <Nav />
          <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-4 sm:pb-12">{children}</main>
          <footer className="mx-auto max-w-3xl px-4 pb-28 text-xs text-muted sm:pb-8">
            <p>
              本アプリの情報は研究文献にもとづく参考情報であり、医療行為・診断・治療の代わりにはなりません。
              体調に不安がある方、妊娠中の方、持病のある方は医師・専門家にご相談ください。精油は原液を肌につけず、飲用しないでください。
            </p>
            <p className="mt-2">Amazon のリンクにはアソシエイトリンクが含まれる場合があります。</p>
          </footer>
        </AppDataProvider>
      </body>
    </html>
  );
}
