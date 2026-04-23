'use client'

import { useEffect, useState, useMemo } from "react";

let listeners = new Set<(y: number) => void>();
let ticking = false;
let currentY = typeof window !== "undefined" ? window.scrollY : 0;

const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    currentY = window.scrollY;
    listeners.forEach((cb) => cb(currentY));
    ticking = false;
  });
};

const ensureListener = () => {
  if (typeof window === "undefined") return;
  if (listeners.size === 0) {
    window.addEventListener("scroll", onScroll, { passive: true });
  }
};

const teardownIfEmpty = () => {
  if (listeners.size === 0) {
    window.removeEventListener("scroll", onScroll);
  }
};

export const useScrollY = () => {
  const [y, setY] = useState(currentY);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    ensureListener();
    listeners.add(setY);
    return () => {
      listeners.delete(setY);
      teardownIfEmpty();
    };
  }, []);

  return y;
};

export const useParallaxTransform = (
  speed: number,
  rotateSpeed = 0,
  baseRotate = 0,
) => {
  const y = useScrollY();
  return useMemo(
    () => ({
      transform: `translate3d(0, ${y * speed}px, 0) rotate(${
        baseRotate + y * rotateSpeed
      }deg)`,
      willChange: "transform" as const,
    }),
    [y, speed, rotateSpeed, baseRotate],
  );
};
