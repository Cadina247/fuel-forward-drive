import React from 'react';
import logoArtwork from '@/assets/cadinatech-logo.png';

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
 * Cadinatech brand mark — the winged-archer medallion cropped from the master
 * artwork, kept on its navy field so it reads on light or dark surfaces.
 */
export const CadinatechMark: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => (
  <div
    role="img"
    aria-label="Cadinatech"
    className={`rounded-full overflow-hidden shrink-0 ${className}`}
    style={{
      width: size,
      height: size,
      backgroundColor: '#0A0E1A',
      backgroundImage: `url(${logoAsset.url})`,
      // Frames the medallion (excludes the wordmark) from the square artwork.
      backgroundSize: '170% 182%',
      backgroundPosition: '49% 26%',
      backgroundRepeat: 'no-repeat',
    }}
  />
);

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
          background: 'linear-gradient(135deg, #F5D061 0%, #D4AF37 45%, #A87F17 100%)',
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
