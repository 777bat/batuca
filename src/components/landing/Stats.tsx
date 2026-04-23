'use client'

import { useEffect, useRef, useState } from "react";
import { Music2, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollY } from "@/hooks/use-parallax";
import { Button } from "@/components/ui/button";

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

const useSectionProgress = (ref: React.RefObject<HTMLElement | null>) => {
  const y = useScrollY();
  const [progress, setProgress] = useState(0);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduce) {
      setProgress(1);
      return;
    }
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh - rect.top) / (vh + rect.height));
    setProgress(p);
  }, [y, ref, reduce]);

  return progress;
};

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;
    const duration = 2000;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active]);
  return value;
}

type ItemProps = {
  icon: typeof Music2;
  value?: number;
  staticText?: string;
  prefix?: string;
  label: string;
  active: boolean;
  align?: "center" | "left";
  size?: "sm" | "lg";
};

const TimelineItem = ({
  icon: Icon,
  value,
  staticText,
  prefix = "+ ",
  label,
  active,
  align = "left",
  size = "lg",
}: ItemProps) => {
  const count = useCountUp(value ?? 0, active);
  const isCenter = align === "center";
  const numberSize =
    size === "sm"
      ? "text-3xl sm:text-4xl md:text-4xl lg:text-5xl"
      : "text-5xl sm:text-6xl md:text-7xl lg:text-8xl";
  const staticSize =
    size === "sm"
      ? "text-2xl sm:text-3xl md:text-3xl lg:text-4xl"
      : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl";
  return (
    <div className={cn(isCenter && "text-center")}>
      <div
        className={cn(
          "flex items-center gap-2 mb-3 text-white/60",
          isCenter && "justify-center",
        )}
      >
        <Icon
          className="h-4 w-4 md:h-5 md:w-5"
          style={{ stroke: "url(#stat-grad)" }}
        />
        <span className="text-xs md:text-sm uppercase tracking-[0.2em]">
          {staticText ? "Reconhecimento" : "Comunidade"}
        </span>
      </div>

      {staticText ? (
        <div
          className={cn(
            staticSize,
            "font-bold leading-[1.05]",
            "bg-clip-text text-transparent",
            "bg-[linear-gradient(135deg,#FFB3B5_0%,#FF7D80_25%,#E85A5E_50%,#FF7D80_75%,#FFB3B5_100%)]",
            "bg-[length:200%_200%] animate-gradient-shift",
          )}
        >
          {staticText}
        </div>
      ) : (
        <div
          className={cn(
            numberSize,
            "font-bold leading-none tabular-nums",
            "bg-clip-text text-transparent",
            "bg-[linear-gradient(135deg,#FFB3B5_0%,#FF7D80_25%,#E85A5E_50%,#FF7D80_75%,#FFB3B5_100%)]",
            "bg-[length:200%_200%] animate-gradient-shift",
          )}
        >
          {prefix}
          {count.toLocaleString("pt-BR")}
        </div>
      )}

      <p
        className={cn(
          "mt-3 text-sm md:text-base text-white/60 leading-relaxed max-w-xs",
          isCenter && "mx-auto",
        )}
      >
        {label}
      </p>
    </div>
  );
};

const Stats = () => {
  const ref = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const [mobileRevealed, setMobileRevealed] = useState(false);
  const progress = useSectionProgress(ref);
  const active = progress > 0.15;

  useEffect(() => {
    const el = mobileRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setMobileRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          setMobileRevealed(e.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative pt-0 pb-16 md:pt-16 md:pb-32 overflow-visible bg-transparent"
      aria-labelledby="stats-heading"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="stat-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFB3B5" />
            <stop offset="50%" stopColor="#FF7D80" />
            <stop offset="100%" stopColor="#E85A5E" />
          </linearGradient>
        </defs>
      </svg>

      <div
        aria-hidden="true"
        className="md:hidden relative z-10 mx-auto h-px w-full max-w-xs sm:max-w-sm md:max-w-md bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] -mt-24 mb-16"
      />

      <div className="container relative z-10">
        <h2 id="stats-heading" className="sr-only">
          Números da Batuca
        </h2>

        <div className="md:hidden" ref={mobileRef}>
          <div className="flex flex-col items-center gap-16">
            <div
              className={cn(
                "transition-all duration-700 ease-out",
                mobileRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              )}
            >
              <TimelineItem
                icon={Music2}
                value={10000}
                label="Músicas criadas com a Batuca no último ano."
                active={active}
                align="center"
              />
            </div>
            <div
              style={{ transitionDelay: "150ms" }}
              className={cn(
                "transition-all duration-700 ease-out",
                mobileRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
              )}
            >
              <TimelineItem
                icon={Award}
                staticText="Destaque 2025"
                label={'Plataforma brasileira em destaque no ano de 2025 pela revista "Startups&iA"'}
                active={active}
                align="center"
              />
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-12">
            <TimelineItem
              icon={Music2}
              value={10000}
              label="Músicas criadas com a Batuca no último ano."
              active={active}
              align="center"
              size="sm"
            />
            <TimelineItem
              icon={Award}
              staticText="Destaque 2025"
              label={'Plataforma brasileira em destaque no ano de 2025 pela revista "Startups&iA"'}
              active={active}
              align="center"
              size="sm"
            />
          </div>
        </div>

        <div className="mt-12 md:mt-16 flex justify-center">
          <Button
            className="bg-gradient-vibrant text-white border-0 px-8 h-12 text-base font-semibold hover:scale-105 transition-all"
          >
            Conhecer nossos planos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Stats;
