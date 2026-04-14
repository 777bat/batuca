import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const coliner = localFont({
  src: [
    { path: "./fonts/Coliner-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Coliner-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Coliner-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Coliner-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Coliner-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Coliner-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-coliner",
  display: "swap",
});

export const metadata: Metadata = {
  title: "batuca.ia — AI Creative Studio",
  description: "Generate stunning images, videos, and music with cutting-edge AI models. The ultimate creative platform.",
  keywords: ["AI", "image generation", "video generation", "music generation", "artificial intelligence", "creative studio"],
  openGraph: {
    title: "batuca.ia — AI Creative Studio",
    description: "Generate stunning images, videos, and music with AI",
    type: "website",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`dark ${coliner.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background selection:bg-accent/30 selection:text-white" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
