'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import HeroChat from "./HeroChat";
import { StarButton } from "@/components/ui/star-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import SymbolOutline from "./SymbolOutline";
import HangingEarphones from "./HangingEarphones";
import { cn } from "@/lib/utils";

const socialAvatars = [
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces", fallback: "AN" },
  { src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=faces", fallback: "JM" },
  { src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=faces", fallback: "LR" },
  { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces", fallback: "PS" },
];

const HeroSimple = () => {
  const [hasText, setHasText] = useState(false);
  const router = useRouter();

  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 z-0 -translate-x-1/3 -translate-y-2/3 md:-translate-x-1/4 md:-translate-y-1/2 text-white/15"
      >
        <SymbolOutline className="h-[28rem] sm:h-[34rem] md:h-[42rem] lg:h-[52rem] w-auto text-white/15" />
      </div>

      <HangingEarphones className="absolute top-0 left-1/2 -translate-x-[62%] z-[5] md:z-20 w-56 sm:w-64 md:w-56 lg:w-64 xl:w-72" />

      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center mx-auto max-w-2xl w-full animate-fade-in">
          <div
            className={cn(
              "mb-6 inline-flex items-center gap-2 md:gap-3 rounded-full",
              "border border-white/15 bg-white/[0.06] backdrop-blur-2xl",
              "px-2 py-1 md:px-4 md:py-2",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
            )}
          >
            <div className="flex -space-x-1.5 md:-space-x-2">
              {socialAvatars.map((a, i) => (
                <Avatar key={i} className="h-4 w-4 md:h-7 md:w-7 ring-0">
                  <AvatarImage src={a.src} alt="" />
                  <AvatarFallback className="text-[8px] md:text-[10px]">{a.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[10px] md:text-sm text-white/85 pr-1">
              Mais de 2.000 criadores usando a Batuca.
            </span>
          </div>

          <h1
            className={cn(
              "font-bold tracking-tight text-white",
              "text-4xl sm:text-5xl md:text-6xl lg:text-7xl",
              "leading-[1.05]",
              "mb-6 sm:mb-8 md:mb-10",
            )}
          >
            Crie sua música em{" "}
            <span
              className={cn(
                "inline-block leading-[1.15] pb-[0.12em] align-baseline",
                "bg-clip-text text-transparent",
                "bg-[linear-gradient(135deg,#FFB3B5_0%,#FF7D80_25%,#E85A5E_50%,#FF7D80_75%,#FFB3B5_100%)]",
                "bg-[length:200%_200%] animate-gradient-shift",
              )}
            >
              segundos
            </span>
            .
          </h1>

          <HeroChat hideSubmitButton onTextChange={setHasText} />

          <div className="mt-6 sm:mt-8">
            <StarButton
              key={hasText ? "cta-on" : "cta-off"}
              onClick={() => router.push("/login")}
              lightColor={hasText ? "#ffffff" : "rgba(255,255,255,0.35)"}
              backgroundColor={
                hasText
                  ? "linear-gradient(135deg,#FFB3B5,#FF7D80,#E85A5E)"
                  : "rgba(255,255,255,0.18)"
              }
              duration={3}
              borderWidth={2}
              innerClassName={cn(
                "relative inline-flex items-center justify-center rounded-full",
                "px-7 py-3.5 sm:px-9 sm:py-4 text-base sm:text-lg font-light whitespace-nowrap",
                "border backdrop-blur-2xl",
                "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px",
                "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
                "transition-all duration-300",
                "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
                hasText
                  ? cn(
                      "text-white border-white/10 bg-white/[0.03]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_50px_rgba(0,0,0,0.35)]",
                      "hover:bg-white/[0.06] hover:border-white/20",
                      "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_14px_60px_rgba(0,0,0,0.4)]",
                    )
                  : cn(
                      "text-white/70 border-white/10 bg-white/[0.02]",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                      "hover:bg-white/[0.05] hover:text-white/90",
                    ),
              )}
            >
              Gerar minha música agora
            </StarButton>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="md:hidden absolute bottom-32 sm:bottom-36 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 sm:gap-2"
      >
        <span className="text-white/50 text-[8px] sm:text-[10px] uppercase tracking-[0.2em]">
          Role para saber mais
        </span>
        <ChevronDown className="h-3 w-3 sm:h-5 sm:w-5 text-white/50 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSimple;
