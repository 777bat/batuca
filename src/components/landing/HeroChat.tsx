'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const GENRES = ["Sertanejo", "Rock", "Pagode", "Funk", "MPB", "Forró", "Samba", "Pop"];

const PHRASES = [
  "Crie uma música sobre alguém saindo da cidade para correr atrás dos sonhos.",
  "Crie uma música sobre a saudade de casa depois de se mudar.",
  "Crie uma música para meu neto que completou 1 aninho.",
];

const TYPE_MS = 45;
const DELETE_MS = 25;
const PAUSE_MS = 1800;

export type HeroChatHandle = { submit: () => void };

interface HeroChatProps {
  hideSubmitButton?: boolean;
  onTextChange?: (hasText: boolean) => void;
}

const HeroChat = forwardRef<HeroChatHandle, HeroChatProps>(({ hideSubmitButton = false, onTextChange }, ref) => {
  const [text, setText] = useState("");

  useEffect(() => {
    onTextChange?.(text.trim().length > 0);
  }, [text, onTextChange]);
  const [selected, setSelected] = useState<string[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || text.length > 0) return;
    const phrase = PHRASES[phraseIndex];
    let delay = TYPE_MS;

    if (phase === "typing") {
      if (charIndex < phrase.length) {
        delay = TYPE_MS;
        const t = setTimeout(() => setCharIndex((c) => c + 1), delay);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("pausing"), 0);
      return () => clearTimeout(t);
    }
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), PAUSE_MS);
      return () => clearTimeout(t);
    }
    if (charIndex > 0) {
      const t = setTimeout(() => setCharIndex((c) => c - 1), DELETE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % PHRASES.length);
      setPhase("typing");
    }, 200);
    return () => clearTimeout(t);
  }, [phase, charIndex, phraseIndex, reducedMotion, text]);

  const toggleGenre = (g: string) => {
    setSelected((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    setText(el.value);
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 168) + "px";
  };

  const handleSubmit = () => {
    if (!text.trim() && selected.length === 0) {
      toast("Escreva algo ou escolha um gênero");
      return;
    }
    toast("Em breve ✨", { description: "Estamos preparando a IA para criar sua música." });
  };

  useImperativeHandle(ref, () => ({ submit: handleSubmit }));

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const animatedSlice = reducedMotion ? PHRASES[0] : PHRASES[phraseIndex].slice(0, charIndex);
  const showPlaceholder = text.length === 0;

  return (
    <div className="w-full max-w-xl sm:max-w-2xl mx-auto">
      <div
        className={cn(
          "group relative rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_50px_rgba(0,0,0,0.35)]",
          "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_60px_rgba(0,0,0,0.4)]",
          "focus-within:border-white/20 focus-within:bg-white/[0.05]",
          "transition-all duration-300",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
          "p-2.5 sm:p-4",
        )}
      >
        <div className="relative">
          <textarea
            ref={taRef}
            value={text}
            onInput={handleInput}
            onChange={() => {}}
            onKeyDown={onKeyDown}
            placeholder=""
            rows={2}
            className={cn(
              "w-full resize-none bg-transparent border-0 outline-none relative z-10",
              "text-white text-sm sm:text-lg leading-snug sm:leading-relaxed",
              "px-1.5 py-1.5 sm:px-2 sm:py-2 min-h-[72px] sm:min-h-[48px] max-h-[168px]",
            )}
          />
          {showPlaceholder && (
            <div
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 z-0 text-left",
                "px-1.5 py-1.5 sm:px-2 sm:py-2",
                "text-sm sm:text-lg leading-snug sm:leading-relaxed text-white/50",
                "whitespace-normal break-words",
                "sm:whitespace-nowrap sm:overflow-hidden sm:[mask-image:linear-gradient(to_right,black_85%,transparent)]",
              )}
            >
              <span>Exemplo: </span>
              <span>{animatedSlice}</span>
              {!reducedMotion && (
                <span className="inline-block w-[1px] h-[1em] align-[-2px] ml-0.5 bg-white/60 animate-pulse" />
              )}
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
          <div
            className={cn(
              "flex-1 min-w-0 flex items-center gap-1.5 sm:gap-2 overflow-x-auto",
              "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
              "[mask-image:linear-gradient(to_right,black_88%,transparent)]",
            )}
          >
            {GENRES.map((g) => {
              const active = selected.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-1 sm:gap-1.5 rounded-full",
                    "px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm",
                    "border backdrop-blur-md transition-all duration-200",
                    "hover:scale-[1.03] active:scale-[0.98]",
                    active
                      ? "text-white border-transparent overflow-hidden bg-[linear-gradient(135deg,#FFB3B5_0%,#FF7D80_25%,#E85A5E_50%,#FF7D80_75%,#FFB3B5_100%)] bg-[length:260%_260%] animate-[gradient-shift_16s_linear_infinite] ring-1 ring-[#FF7D80]/40 shadow-[inset_0_0_12px_rgba(255,255,255,0.25),inset_0_1px_0_rgba(255,255,255,0.35)]"
                      : "bg-white/10 border-white/20 text-white/90 hover:bg-white/15",
                  )}
                >
                  {active ? <Check className="size-3 sm:size-3.5" /> : <Plus className="size-3 sm:size-3.5" />}
                  <span className="whitespace-nowrap">{g}</span>
                </button>
              );
            })}
          </div>

          {!hideSubmitButton && (() => {
            const hasText = text.trim().length > 0;
            return hasText ? (
              <button
                key="cta-on"
                type="button"
                onClick={handleSubmit}
                aria-label="Enviar"
                className={cn(
                  "group/send relative shrink-0 inline-flex items-center justify-center rounded-full",
                  "h-11 w-11 sm:h-14 sm:w-14 text-white",
                  "border border-white/30 backdrop-blur-md",
                  "transition-all duration-300 hover:scale-110 active:scale-95",
                  "bg-[linear-gradient(135deg,#a855f7_0%,#ec4899_50%,#3b82f6_100%)] bg-[length:200%_200%]",
                  "animate-[gradient-shift_8s_ease_infinite]",
                  "shadow-[0_4px_24px_rgba(168,85,247,0.45)]",
                  "hover:shadow-[0_6px_32px_rgba(236,72,153,0.6)]",
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-white/40 animate-pulse"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/batuca-contorno.svg"
                  alt=""
                  aria-hidden
                  className="relative size-5 sm:size-6 transition-all duration-300 group-hover/send:scale-110"
                />
              </button>
            ) : (
              <button
                key="cta-off"
                type="button"
                onClick={handleSubmit}
                aria-label="Enviar"
                className={cn(
                  "group/send relative shrink-0 inline-flex items-center justify-center rounded-full",
                  "h-11 w-11 sm:h-14 sm:w-14 text-white",
                  "border border-white/25 bg-white/10 backdrop-blur-md",
                  "transition-all duration-300 hover:scale-110 active:scale-95",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/landing/batuca-contorno.svg"
                  alt=""
                  aria-hidden
                  className="relative size-5 sm:size-6 opacity-60 transition-all duration-300 group-hover/send:scale-110"
                />
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
});

HeroChat.displayName = "HeroChat";

export default HeroChat;
