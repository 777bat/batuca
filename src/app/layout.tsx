import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
    <html lang="pt-BR" className={`dark ${outfit.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen bg-background selection:bg-accent/30 selection:text-white" suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
