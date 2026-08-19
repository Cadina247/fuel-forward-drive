import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_LOCATION, haversineKm } from '@/hooks/useNearbyStations';

/**
 * Hyperlocal delivery-provider matching.
 *
 * Providers are managed in the web portal (`delivery_providers`) — this app
 * only reads them and ranks the ones already operating around the customer.
 * Ranking inputs: proximity to the customer, availability, estimated pickup
 * time, current workload, service area, reliability/rating and Fast Track
 * eligibility. Delivery pricing is distance-based, never a flat arbitrary fee.
 */

export type ServiceLevel = 'standard' | 'fast';

export interface DeliveryProvider {
  id: string;
  name: string;
  phone: string | null;
  lat: number;
  lng: number;
  serviceArea: string | null;
  isAvailable: boolean;
  activeJobs: number;
  rating: number;
  fastTrack: boolean;
  vehicle: string | null;
}

export interface RankedProvider extends DeliveryProvider {
  /** Provider → customer distance (the hyperlocal signal). */
  distanceKm: number;
  /** Provider → station → customer round trip used for pricing. */
  logisticsKm: number;
  pickupMinutes: number;
  fee: number;
  score: number;
}

/** Local partners used until the portal has published its provider network. */
const FALLBACK_PROVIDERS: DeliveryProvider[] = [
  { id: 'prov-a', name: 'SwiftRun Logistics', phone: '+2348012345678', lat: 6.4462, lng: 3.4712, serviceArea: 'Lekki', isAvailable: true, activeJobs: 0, rating: 4.9, fastTrack: true, vehicle: 'Bike' },
  { id: 'prov-b', name: 'Lekki Express Riders', phone: '+2348023456789', lat: 6.4551, lng: 3.4802, serviceArea: 'Lekki', isAvailable: true, activeJobs: 1, rating: 4.7, fastTrack: true, vehicle: 'Bike' },
  { id: 'prov-c', name: 'Ajah Movers', phone: '+2348034567890', lat: 6.4682, lng: 3.5124, serviceArea: 'Ajah', isAvailable: true, activeJobs: 2, rating: 4.4, fastTrack: false, vehicle: 'Tricycle' },
  { id: 'prov-d', name: 'Ikeja Quick Dispatch', phone: '+2348045678901', lat: 6.6018, lng: 3.3515, serviceArea: 'Ikeja', isAvailable: true, activeJobs: 0, rating: 4.6, fastTrack: true, vehicle: 'Bike' },
  { id: 'prov-e', name: 'Surulere Runners', phone: '+2348056789012', lat: 6.4969, lng: 3.352, serviceArea: 'Surulere', isAvailable: true, activeJobs: 1, rating: 4.3, fastTrack: false, vehicle: 'Bike' },
];

/** Distance-based pricing — service level changes the rate, not a flat surcharge. */
const PRICING = {
  standard: { base: 400, perKm: 120, minutesPerKm: 4, handling: 100 },
  fast: { base: 700, perKm: 190, minutesPerKm: 2.5, handling: 150 },
} as const;

export function quoteDelivery(logisticsKm: number, level: ServiceLevel) {
  const p = PRICING[level];
  return Math.round((p.base + p.perKm * logisticsKm + p.handling) / 50) * 50;
}

/** Line-by-line fee + ETA breakdown shown to the customer. */
export function deliveryBreakdown(logisticsKm: number, level: ServiceLevel, activeJobs = 0) {
  const p = PRICING[level];
  const distanceFee = Math.round(p.perKm * logisticsKm);
  const total = quoteDelivery(logisticsKm, level);
  const travelMinutes = Math.round(logisticsKm * p.minutesPerKm);
  const queueMinutes = activeJobs * 6;
  const handlingMinutes = level === 'fast' ? 3 : 6;
  return {
    lines: [
      { label: 'Base dispatch fee', value: p.base },
      { label: `Distance (${logisticsKm.toFixed(1)} km @ ₦${p.perKm}/km)`, value: distanceFee },
      { label: 'Handling & container care', value: p.handling },
      { label: 'Rounding', value: total - (p.base + distanceFee + p.handling) },
    ],
    total,
    eta: [
      { label: 'Rider travel time', minutes: travelMinutes },
      { label: 'Station pickup & loading', minutes: handlingMinutes },
      { label: 'Queue (active jobs)', minutes: queueMinutes },
    ],
    etaMinutes: Math.max(5, travelMinutes + handlingMinutes + queueMinutes),
  };
}


interface Options {
  customer?: { lat: number; lng: number } | null;
  station?: { lat: number; lng: number } | null;
  serviceLevel?: ServiceLevel;
  radiusKm?: number;
}

export function useHyperlocalProviders({
  customer,
  station,
  serviceLevel = 'standard',
  radiusKm = 10,
}: Options) {
  const [providers, setProviders] = useState<DeliveryProvider[]>(FALLBACK_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number>(() => Date.now());
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from('delivery_providers' as never).select('*');
    if (!mounted.current) return;
    const rows = (data as any[]) || [];
    if (rows.length) {
      setProviders(
        rows.map((r, i) => ({
          id: String(r.id ?? `provider-${i}`),
          name: r.business_name ?? r.name ?? 'Delivery partner',
          phone: r.phone ?? null,
          lat: Number(r.latitude ?? r.lat ?? DEFAULT_LOCATION.lat),
          lng: Number(r.longitude ?? r.lng ?? DEFAULT_LOCATION.lng),
          serviceArea: r.service_area ?? r.area ?? null,
          isAvailable: r.is_available ?? r.is_online ?? true,
          activeJobs: Number(r.active_jobs ?? 0),
          rating: Number(r.rating ?? 4.5),
          fastTrack: Boolean(r.fast_track_enabled ?? r.fast_track ?? true),
          vehicle: r.vehicle_type ?? r.vehicle ?? null,
        }))
      );
    }
    setLastUpdated(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    // Safety-net refresh in case a Realtime event is missed.
    const poll = setInterval(load, 60_000);
    return () => {
      mounted.current = false;
      clearInterval(poll);
    };
  }, [load]);

  // Live availability/workload changes published by the portal.
  useEffect(() => {
    const channel = supabase
      .channel('delivery_providers_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery_providers' }, (payload) => {
        const row = payload.new as any;
        if (!row?.id) {
          // Insert/delete — pull the full list again.
          load();
          return;
        }
        setProviders((prev) => {
          if (!prev.some((p) => p.id === String(row.id))) {
            load();
            return prev;
          }
          return prev.map((p) =>
            p.id === String(row.id)
              ? {
                  ...p,
                  isAvailable: row.is_available ?? row.is_online ?? p.isAvailable,
                  activeJobs: Number(row.active_jobs ?? p.activeJobs),
                }
              : p
          );
        });
        setLastUpdated(Date.now());
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const ranked = useMemo<RankedProvider[]>(() => {
    const cust = customer ?? DEFAULT_LOCATION;
    const stn = station ?? cust;

    return providers
      .filter((p) => p.isAvailable && (serviceLevel === 'standard' || p.fastTrack))
      .map((p) => {
        const distanceKm = haversineKm(cust, { lat: p.lat, lng: p.lng });
        // Provider → station (collect the container) → customer.
        const logisticsKm =
          haversineKm({ lat: p.lat, lng: p.lng }, stn) + haversineKm(stn, cust);
        const cfg = PRICING[serviceLevel];
        const pickupMinutes = Math.max(
          5,
          Math.round(distanceKm * cfg.minutesPerKm + p.activeJobs * 6)
        );
        const fee = quoteDelivery(logisticsKm, serviceLevel);
        // Lower score = better match.
        const score = distanceKm * 2 + p.activeJobs * 1.5 + (5 - p.rating) * 2 + fee / 1500;
        return { ...p, distanceKm, logisticsKm, pickupMinutes, fee, score };
      })
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);
  }, [providers, customer, station, serviceLevel, radiusKm]);

  return { providers: ranked, allProviders: providers, loading };
}

export default useHyperlocalProviders;
