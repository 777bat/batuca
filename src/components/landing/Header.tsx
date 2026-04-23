'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled ? "py-3" : "py-5",
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-transparent">
          <a href="#top" aria-label="Batuca">
            <span
              role="img"
              aria-label="Batuca"
              className="relative block h-10 md:h-12"
              style={{ aspectRatio: "2178 / 1895" }}
            >
              {/* Hastes — branco sólido */}
              <span
                aria-hidden
                className="absolute inset-0 bg-white"
                style={{
                  WebkitMaskImage: `url(/landing/logo-batuca-hastes.svg)`,
                  maskImage: `url(/landing/logo-batuca-hastes.svg)`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
              {/* Círculos — gradiente animado coral */}
              <span
                aria-hidden
                className="absolute inset-0 animate-gradient-shift"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #FFB3B5 0%, #FF7D80 50%, #E85A5E 100%)",
                  backgroundSize: "200% 200%",
                  WebkitMaskImage: `url(/landing/logo-batuca-circulos.svg)`,
                  maskImage: `url(/landing/logo-batuca-circulos.svg)`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                }}
              />
            </span>
          </a>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/signup"
              className={cn(
                "relative overflow-hidden rounded-full px-4 md:px-5 py-2 text-xs md:text-sm font-medium text-white",
                "bg-[linear-gradient(135deg,#FFB3B5,#FF7D80,#E85A5E)] bg-[length:200%_200%] animate-gradient-shift",
                "border border-white/20",
                "shadow-[0_4px_20px_-4px_rgba(255,125,128,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]",
                "transition-all duration-300 ease-out",
                "hover:-translate-y-0.5 hover:shadow-[0_6px_28px_-4px_rgba(255,125,128,0.6),inset_0_1px_0_rgba(255,255,255,0.3)]",
              )}
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className={cn(
                "relative overflow-hidden rounded-full px-4 md:px-5 py-2 text-xs md:text-sm font-medium text-white",
                "bg-white/[0.06] backdrop-blur-2xl border border-white/15",
                "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
                "transition-all duration-300 ease-out",
                "hover:bg-white/[0.10] hover:-translate-y-0.5 hover:border-white/25",
                "before:content-[''] before:absolute before:inset-x-3 before:top-0 before:h-px",
                "before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
              )}
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
