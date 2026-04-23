'use client'

import React, { useRef, useEffect, ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface StarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  lightWidth?: number;
  duration?: number;
  lightColor?: string;
  backgroundColor?: string;
  borderWidth?: number;
  className?: string;
  innerClassName?: string;
}

export function StarButton({
  children,
  lightWidth = 110,
  duration = 3,
  lightColor = "#FAFAFA",
  backgroundColor = "currentColor",
  borderWidth = 2,
  className,
  innerClassName,
  ...props
}: StarButtonProps) {
  const pathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const setPath = () => {
      el.style.setProperty(
        "--path",
        `path('M 0 0 H ${el.offsetWidth} V ${el.offsetHeight} H 0 V 0')`,
      );
    };
    setPath();
    const ro = new ResizeObserver(setPath);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <button
      {...props}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full isolate",
        className,
      )}
      style={{
        padding: borderWidth,
        ...(props.style ?? {}),
      }}
    >
      <div
        ref={pathRef}
        className="absolute inset-0 rounded-full"
        style={{
          background: backgroundColor,
        }}
      >
        <div
          className="absolute top-0 left-0 animate-star-btn"
          style={
            {
              width: lightWidth,
              height: lightWidth,
              marginTop: -lightWidth / 2,
              marginLeft: -lightWidth / 2,
              background: `radial-gradient(closest-side, ${lightColor}, transparent)`,
              offsetPath: "var(--path)",
              ["--duration" as never]: `${duration}s`,
            } as React.CSSProperties
          }
        />
      </div>

      <div
        className={cn(
          "relative z-10 inline-flex items-center justify-center rounded-full bg-[#0A0A0A] text-white px-7 py-3.5 sm:px-9 sm:py-4 text-base sm:text-lg font-semibold whitespace-nowrap",
          innerClassName,
        )}
      >
        {children}
      </div>
    </button>
  );
}

export default StarButton;
