// Jeu d'icônes dessiné à la main : trait 1,6, bouts arrondis, grille 24. Aucune émoticône.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function LogoMark({ size = 28, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden {...p}>
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeOpacity=".25" />
      <path d="M7 10.5 16 17M25 9 16 17M15 26.5 16 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="7" cy="10.5" r="2.4" fill="var(--color-reseau-a)" />
      <circle cx="25" cy="9" r="2.4" fill="var(--color-reseau-b)" />
      <circle cx="15" cy="26.5" r="2.4" fill="var(--color-reseau-c)" />
      <circle cx="16" cy="17" r="3.6" fill="var(--color-laterite)" />
    </svg>
  );
}

export const IconArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconShield = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);
export const IconSnow = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
    <path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2" />
  </svg>
);
export const IconRefund = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
    <path d="M12 8v4l2.5 2" />
  </svg>
);
export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);
export const IconGraph = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="5.5" cy="6" r="2" />
    <circle cx="18.5" cy="6" r="2" />
    <circle cx="12" cy="18.5" r="2" />
    <circle cx="12" cy="11" r="2.4" />
    <path d="m7.2 7.2 3 2.4M16.8 7.2l-3 2.4M12 13.4v3.1" />
  </svg>
);
export const IconFile = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M8.5 13h7M8.5 16.5h5" />
  </svg>
);
export const IconRadar = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 12 18 6" />
  </svg>
);
export const IconChart = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);
export const IconHome = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m4 11 8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5V11Z" />
  </svg>
);
export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
  </svg>
);
export const IconHash = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16" />
  </svg>
);
export const IconMessage = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5v-8Z" />
  </svg>
);
export const IconSend = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m4 12 16-8-6 16-2.5-6.5L4 12Z" />
  </svg>
);
export const IconClose = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const IconAlert = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 4 2.8 19.5h18.4L12 4Z" />
    <path d="M12 10v4.2M12 17.2v.1" />
  </svg>
);
export const IconLogout = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l4-4-4-4M14 12H4" />
  </svg>
);
export const IconSpark = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
  </svg>
);
export const IconChip = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </svg>
);
