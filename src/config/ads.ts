/**
 * =====================================================================
 * AD CONFIGURATION
 * ---------------------------------------------------------------------
 * Leave a value as an empty string ("") to keep that network disabled.
 * When ALL networks are empty, the AdSlot falls back to the built-in
 * house/promo rotation automatically.
 *
 * Priority order (first configured one wins):
 *   1. AdMob (native builds via Capacitor)
 *   2. Google AdSense / Ad Manager (web)
 *   3. Generic embed (TikTok / YouTube / any iframe or script tag)
 *   4. House ads (default fallback)
 * =====================================================================
 */

export interface AdsConfig {
  /** Google AdSense / Google Ad Manager (web banner) */
  adsense: {
    /** PASTE YOUR PUBLISHER ID HERE e.g. "ca-pub-1234567890123456" */
    client: string;
    /** PASTE YOUR AD UNIT / SLOT ID HERE e.g. "1234567890" */
    slot: string;
    format?: string;
    fullWidthResponsive?: boolean;
  };

  /** Google AdMob (only used when running as a native app via Capacitor) */
  admob: {
    /** PASTE YOUR ADMOB APP ID HERE e.g. "ca-app-pub-1234567890123456~1234567890" */
    appId: string;
    /** PASTE YOUR ADMOB BANNER AD UNIT ID HERE e.g. "ca-app-pub-1234567890123456/1234567890" */
    bannerAdUnitId: string;
    /** Set to true while developing to serve Google test ads */
    testMode: boolean;
  };

  /** Generic embed slot: TikTok / YouTube / any other iframe or script-based ad */
  embed: {
    /** PASTE AN IFRAME URL HERE e.g. "https://www.youtube.com/embed/VIDEO_ID" */
    iframeSrc: string;
    /** OR PASTE RAW EMBED HTML HERE (script/ins tags from the ad network) */
    html: string;
    /** Height of the embed in px */
    height: number;
  };

  /** Seconds between house-ad rotations */
  houseRotationSeconds: number;
}

export const adsConfig: AdsConfig = {
  adsense: {
    client: '', // <-- ca-pub-XXXXXXXXXXXXXXXX
    slot: '', // <-- XXXXXXXXXX
    format: 'auto',
    fullWidthResponsive: true,
  },
  admob: {
    appId: '', // <-- ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
    bannerAdUnitId: '', // <-- ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
    testMode: true,
  },
  embed: {
    iframeSrc: '', // <-- https://www.youtube.com/embed/VIDEO_ID  (or TikTok embed URL)
    html: '', // <-- raw <script>/<ins> embed snippet
    height: 100,
  },
  houseRotationSeconds: 5.5,
};

/** House / promo ads shown when no network is configured. */
export interface HouseAd {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  /** Tailwind gradient/background classes using design tokens */
  className: string;
  /** Optional in-app screen to navigate to on tap */
  target?: string;
}

export const houseAds: HouseAd[] = [
  {
    id: 'delivery',
    title: 'Fuel at your doorstep',
    subtitle: 'Order petrol or diesel, delivered in minutes.',
    cta: 'Order now',
    className: 'bg-gradient-fuel text-white',
    target: 'order-fuel',
  },
  {
    id: 'gas',
    title: 'Cooking gas refills',
    subtitle: 'Refill by the kg from stations near you.',
    cta: 'Refill gas',
    className: 'bg-gradient-to-r from-primary to-primary/70 text-primary-foreground',
    target: 'order-fuel',
  },
  {
    id: 'wallet',
    title: 'Pay faster with Wallet',
    subtitle: 'Fund once, checkout in one tap.',
    cta: 'Fund wallet',
    className: 'bg-gradient-to-r from-secondary to-secondary/60 text-secondary-foreground',
    target: 'fund-wallet',
  },
  {
    id: 'ev',
    title: 'EV charging nearby',
    subtitle: 'Find available chargers around you.',
    cta: 'Find chargers',
    className: 'bg-gradient-to-r from-accent to-accent/60 text-accent-foreground',
    target: 'ev-charging',
  },
];

export type AdNetwork = 'admob' | 'adsense' | 'embed' | 'house';

export function resolveAdNetwork(config: AdsConfig = adsConfig): AdNetwork {
  const isNative =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());

  if (isNative && config.admob.appId && config.admob.bannerAdUnitId) return 'admob';
  if (config.adsense.client && config.adsense.slot) return 'adsense';
  if (config.embed.iframeSrc || config.embed.html) return 'embed';
  return 'house';
}
