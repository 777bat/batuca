'use client'

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

const HangingEarphones = ({ className }: Props) => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none select-none", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/landing/fone-earpods.png"
        alt=""
        draggable={false}
        style={{ transformOrigin: "top center" }}
        className={cn(
          "w-full h-auto will-change-transform",
          reduced ? "" : "animate-swing",
        )}
      />
    </div>
  );
};

export default HangingEarphones;
