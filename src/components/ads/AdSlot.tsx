import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { adsConfig, houseAds, resolveAdNetwork } from '@/config/ads';

interface AdSlotProps {
  /** Optional navigation handler so house ads can deep-link into the app */
  onNavigate?: (screen: string) => void;
  className?: string;
}

const AdLabel: React.FC = () => (
  <span className="absolute top-1.5 right-1.5 z-10 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
    Ad
  </span>
);

/** Google AdSense / Ad Manager web banner. IDs come from src/config/ads.ts */
const AdSenseAd: React.FC = () => {
  const pushed = useRef(false);
  useEffect(() => {
    if (pushed.current) return;
    pushed.current = true;
    try {
      ((window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
        (window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      /* blocked or script not loaded */
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block w-full"
      style={{ display: 'block', minHeight: 90 }}
      data-ad-client={adsConfig.adsense.client}
      data-ad-slot={adsConfig.adsense.slot}
      data-ad-format={adsConfig.adsense.format}
      data-full-width-responsive={adsConfig.adsense.fullWidthResponsive ? 'true' : 'false'}
      aria-label="Sponsored advertisement"
    />
  );
};

/** AdMob banner for native (Capacitor) builds. Renders via @capacitor-community/admob if installed. */
const ADMOB_MODULE = '@capacitor-community/admob';

const AdMobAd: React.FC = () => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Dynamic import so web builds never require the native plugin.
        const mod: any = await import(/* @vite-ignore */ ADMOB_MODULE);
        if (cancelled) return;
        await mod.AdMob.initialize({ initializeForTesting: adsConfig.admob.testMode });
        await mod.AdMob.showBanner({
          adId: adsConfig.admob.bannerAdUnitId,
          adSize: 'BANNER',
          position: 'BOTTOM_CENTER',
          isTesting: adsConfig.admob.testMode,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      import(/* @vite-ignore */ ADMOB_MODULE)
        .then((mod: any) => mod.AdMob.removeBanner?.())
        .catch(() => undefined);
    };
  }, []);

  if (failed) return <HouseAdRotator />;
  return <div className="h-[90px] w-full" aria-label="Sponsored advertisement" />;
};

/** Generic TikTok / YouTube / iframe or script embed. */
const EmbedAd: React.FC = () => {
  const { iframeSrc, html, height } = adsConfig.embed;
  if (iframeSrc) {
    return (
      <iframe
        src={iframeSrc}
        title="Sponsored advertisement"
        className="w-full border-0"
        style={{ height }}
        loading="lazy"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return <div className="w-full" style={{ minHeight: height }} dangerouslySetInnerHTML={{ __html: html }} />;
};

/** Default: auto-rotating house/promo ads. */
const HouseAdRotator: React.FC<{ onNavigate?: (screen: string) => void }> = ({ onNavigate }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (houseAds.length <= 1) return;
    const period = Math.max(2, adsConfig.houseRotationSeconds) * 1000;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % houseAds.length);
        setVisible(true);
      }, 280);
    }, period);
    return () => window.clearInterval(id);
  }, []);

  const ad = houseAds[index];

  return (
    <button
      type="button"
      onClick={() => ad.target && onNavigate?.(ad.target)}
      className={`flex w-full items-center justify-between gap-3 p-4 text-left transition-all duration-300 ${ad.className} ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
      }`}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold sm:text-base">{ad.title}</h3>
        <p className="truncate text-xs opacity-90 sm:text-sm">{ad.subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
        {ad.cta}
      </span>
    </button>
  );
};

/**
 * Reusable ad slot. Picks the configured network from src/config/ads.ts,
 * falling back to the house promo rotation when nothing is configured.
 */
const AdSlot: React.FC<AdSlotProps> = ({ onNavigate, className = '' }) => {
  const network = resolveAdNetwork();

  return (
    <Card className={`relative w-full overflow-hidden border-border/50 p-0 ${className}`}>
      <AdLabel />
      {network === 'admob' && <AdMobAd />}
      {network === 'adsense' && <AdSenseAd />}
      {network === 'embed' && <EmbedAd />}
      {network === 'house' && <HouseAdRotator onNavigate={onNavigate} />}
    </Card>
  );
};

export default AdSlot;
