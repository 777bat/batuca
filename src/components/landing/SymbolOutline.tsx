'use client'

import { useId } from "react";

interface SymbolOutlineProps {
  className?: string;
  delayOffset?: number;
  vibrant?: boolean;
}

const SymbolOutline = ({ className, delayOffset = 0, vibrant = false }: SymbolOutlineProps) => {
  const rawId = useId();
  const gradId = `batuca-vibrant-${rawId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 773 672"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "w-full h-full text-white/20"}
      aria-hidden="true"
    >
      {vibrant && (
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB3B5" />
            <stop offset="50%" stopColor="#FF7D80" />
            <stop offset="100%" stopColor="#E85A5E" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M711.882 0C679.069 0 651.724 27.3448 651.724 60.1586V246.103C721.909 268.891 772.041 334.518 772.041 411.995V60.1586C772.041 27.3448 744.696 0 711.882 0Z"
        className="symbol-draw"
        style={{ animationDelay: `${0 + delayOffset}s` }}
      />
      <path
        d="M651.725 246.1C634.406 240.631 616.176 237.896 597.035 237.896C500.417 237.896 422.94 316.285 422.94 411.992C422.94 507.699 501.328 586.087 597.035 586.087C692.742 586.087 771.13 508.61 771.13 411.992C771.13 334.515 720.998 268.887 650.813 246.1H651.725Z"
        className="symbol-draw"
        stroke={vibrant ? `url(#${gradId})` : "currentColor"}
        opacity={vibrant ? 0.9 : undefined}
        style={{ animationDelay: `${0.4 + delayOffset}s` }}
      />
      <path
        d="M288.944 86.5898C256.131 86.5898 228.786 113.935 228.786 146.748V332.693C298.971 355.481 349.103 421.108 349.103 498.585V146.748C349.103 113.935 321.758 86.5898 288.944 86.5898Z"
        className="symbol-draw"
        style={{ animationDelay: `${0.8 + delayOffset}s` }}
      />
      <path
        d="M228.785 331.781C211.467 326.312 193.237 323.578 174.095 323.578C77.477 323.578 0 401.966 0 497.673C0 593.38 78.3885 671.768 174.095 671.768C269.802 671.768 348.191 594.291 348.191 497.673C348.191 420.196 298.058 354.568 227.873 331.781H228.785Z"
        className="symbol-draw"
        stroke={vibrant ? `url(#${gradId})` : "currentColor"}
        opacity={vibrant ? 0.9 : undefined}
        style={{ animationDelay: `${1.2 + delayOffset}s` }}
      />
    </svg>
  );
};

export default SymbolOutline;
