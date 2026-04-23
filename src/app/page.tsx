import type { Metadata } from "next";
import Header from "@/components/landing/Header";
import HeroSimple from "@/components/landing/HeroSimple";
import Stats from "@/components/landing/Stats";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Batuca — Crie músicas com IA. Em segundos.",
  description:
    "Plataforma de IA musical para criar músicas completas — beat, letra e estilo — em segundos. Sem estúdio, sem limites.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      <Header />
      <main>
        <div className="relative bg-[#0A0A0A]">
          <div
            aria-hidden
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: "url(/landing/hero-guitarrista.jpg)",
              filter: "grayscale(1)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.70) 0%, rgba(10,10,10,0.82) 45%, rgba(10,10,10,0.95) 80%, #0A0A0A 100%)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 animate-gradient-shift"
            style={{
              background:
                "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(10,10,10,0.25) 35%, rgba(0,0,0,0.65) 70%, rgba(10,10,10,0.45) 100%)",
              backgroundSize: "200% 200%",
              mixBlendMode: "multiply",
              animationDuration: "12s",
            }}
          />
          <div className="relative">
            <HeroSimple />
            <Stats />
          </div>
        </div>
        <div className="bg-[#0A0A0A]">
          <FAQ />
        </div>
      </main>
      <Footer />
    </div>
  );
}
