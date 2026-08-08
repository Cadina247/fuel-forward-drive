import React, { useId } from 'react';

interface CadinatechLogoProps {
  /** Badge diameter in px */
  size?: number;
  /** Show the CADINATECH wordmark next to / below the badge */
  showWordmark?: boolean;
  /** Wordmark placement relative to the badge */
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Cadinatech brand mark — self-contained navy badge with a gold winged-archer
 * medallion, so it sits cleanly on light or dark backgrounds.
 * Pure SVG: crisp at any size.
 */
export const CadinatechMark: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const gold = `gold-${uid}`;
  const goldDeep = `goldDeep-${uid}`;

  // Tick marks around the rim, clock-face style (no numbers)
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const angle = (i * 6 * Math.PI) / 180;
    const outer = 92;
    const inner = major ? 82 : 87;
    return {
      key: i,
      x1: 100 + outer * Math.sin(angle),
      y1: 100 - outer * Math.cos(angle),
      x2: 100 + inner * Math.sin(angle),
      y2: 100 - inner * Math.cos(angle),
      w: major ? 2.6 : 1.2,
      o: major ? 0.95 : 0.55,
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Cadinatech"
      className={className}
    >
      <defs>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F5D061" />
          <stop offset="45%" stopColor="#E4C25A" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id={goldDeep} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8C6E1F" />
        </linearGradient>
      </defs>

      {/* Navy medallion field */}
      <circle cx="100" cy="100" r="100" fill="#0A0E1A" />
      <circle cx="100" cy="100" r="97" fill="none" stroke={`url(#${gold})`} strokeWidth="2" opacity="0.5" />

      {/* Compass / coin rim */}
      <circle cx="100" cy="100" r="92" fill="none" stroke={`url(#${gold})`} strokeWidth="3.2" />
      <circle cx="100" cy="100" r="78" fill="none" stroke={`url(#${goldDeep})`} strokeWidth="1" opacity="0.55" />
      <g stroke={`url(#${gold})`} strokeLinecap="round">
        {ticks.map((t) => (
          <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.w} opacity={t.o} />
        ))}
      </g>

      {/* Wings — layered feathers sweeping up and back */}
      <g fill={`url(#${goldDeep})`} opacity="0.85">
        <path d="M92 96c-18-6-34-20-42-38 14 4 26 11 35 21-4-10-6-20-5-30 9 10 15 22 17 35z" />
        <path d="M96 106c-20-2-38-12-50-28 15 1 28 6 39 14-6-9-10-19-11-29 11 8 19 19 24 31z" />
      </g>
      <g fill={`url(#${gold})`}>
        <path d="M98 92c-16-9-28-25-33-44 13 6 24 16 31 27-2-11-2-22 1-32 7 12 10 26 9 40z" />
        <path d="M101 104c-19-5-35-19-44-38 15 3 28 10 38 20-5-10-8-21-8-31 10 11 16 24 18 38z" />
        <path d="M103 116c-21 0-40-9-54-25 16 0 30 4 42 12-7-9-12-19-14-29 12 8 22 20 28 33z" />
      </g>

      {/* Sparkle accents, upper-left of the wings */}
      <g fill={`url(#${gold})`}>
        <path d="M46 40l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
        <path d="M64 26l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" opacity="0.85" />
      </g>

      {/* Archer figure — drawing a bow aimed to the upper right */}
      <g fill={`url(#${gold})`}>
        {/* head */}
        <circle cx="112" cy="72" r="9" />
        {/* torso, twisted into the draw */}
        <path d="M108 82c7-3 14-1 17 5l6 12c1 3 0 6-3 7s-6 0-7-3l-4-9-4 14 9 14c2 3 1 6-2 8s-6 1-8-2l-11-17c-2-3-2-6-1-9l5-16c1-2 2-3 3-4z" />
        {/* forward arm extending to the bow */}
        <path d="M124 88c1-3 4-4 7-3l19 8c3 1 4 4 3 7s-4 4-7 3l-19-8c-3-1-4-4-3-7z" />
        {/* drawing arm pulled back */}
        <path d="M110 92c2-2 6-2 8 1l1 2c2 3 1 6-2 8l-14 8c-3 2-6 1-8-2s-1-6 2-8z" />
        {/* legs in mid-motion */}
        <path d="M110 124c3-1 6 1 7 4l6 20c1 3-1 6-4 7s-6-1-7-4l-6-20c-1-3 1-6 4-7z" />
        <path d="M100 126c3 1 4 4 3 7l-9 21c-1 3-5 4-8 3s-4-4-3-7l9-21c1-3 5-4 8-3z" />
      </g>

      {/* Bow and arrow */}
      <g fill="none" stroke={`url(#${gold})`} strokeLinecap="round">
        <path d="M162 58c12 18 12 40 0 58" strokeWidth="4.5" />
        <path d="M162 58L120 100l42 16" strokeWidth="1.6" opacity="0.9" />
        <path d="M120 100l52-44" strokeWidth="3.4" />
      </g>
      <path d="M172 56l-16 3 11 6z" fill={`url(#${gold})`} />
      <path d="M126 104l8-10-9 3z" fill={`url(#${goldDeep})`} />
    </svg>
  );
};

const CadinatechLogo: React.FC<CadinatechLogoProps> = ({
  size = 36,
  showWordmark = true,
  orientation = 'horizontal',
  className = '',
}) => (
  <div
    className={`flex ${orientation === 'horizontal' ? 'flex-row items-center gap-2.5' : 'flex-col items-center gap-2'} ${className}`}
  >
    <CadinatechMark size={size} />
    {showWordmark && (
      <span
        className="font-serif font-semibold uppercase leading-none"
        style={{
          letterSpacing: '0.18em',
          fontSize: Math.max(12, Math.round(size * 0.42)),
          background: 'linear-gradient(135deg, #F5D061 0%, #D4AF37 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        Cadinatech
      </span>
    )}
  </div>
);

export default CadinatechLogo;
