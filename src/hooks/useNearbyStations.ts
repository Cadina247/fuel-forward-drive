import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface NearbyStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number | null;
  distanceKm?: number;
}

/** Fallback station directory used when the shared backend has no `stations` table yet. */
const FALLBACK_STATIONS: NearbyStation[] = [
  { id: 'shell-vi', name: 'Shell - Victoria Island', address: '1 Adeola Odeku St, Victoria Island, Lagos', lat: 6.4281, lng: 3.4219, rating: 4.8 },
  { id: 'total-lekki', name: 'Total - Lekki Phase 1', address: '12 Admiralty Way, Lekki Phase 1, Lagos', lat: 6.4459, lng: 3.4739, rating: 4.6 },
  { id: 'mobil-ikeja', name: 'Mobil - Ikeja', address: 'Obafemi Awolowo Way, Ikeja, Lagos', lat: 6.6018, lng: 3.3515, rating: 4.5 },
  { id: 'nnpc-yaba', name: 'NNPC Retail - Yaba', address: 'Herbert Macaulay Way, Yaba, Lagos', lat: 6.5095, lng: 3.3711, rating: 4.3 },
  { id: 'ardova-surulere', name: 'Ardova - Surulere', address: 'Bode Thomas St, Surulere, Lagos', lat: 6.4969, lng: 3.3520, rating: 4.2 },
  { id: 'conoil-ajah', name: 'Conoil - Ajah', address: 'Lekki-Epe Expressway, Ajah, Lagos', lat: 6.4698, lng: 3.5852, rating: 4.1 },
];

/** Default user location (Lekki Phase 1) used until geolocation resolves. */
export const DEFAULT_LOCATION = { lat: 6.4459, lng: 3.4739 };

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const titleize = (id: string) =>
  id.split(/[-_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * Stations nearest to the user, ordered by proximity.
 * Reads `stations` from the shared backend when available, otherwise uses the
 * local directory, and always merges any station_id seen in `fuel_products`.
 */
export function useNearbyStations(radiusKm = 15) {
  const [stations, setStations] = useState<NearbyStation[]>(FALLBACK_STATIONS);
  const [coords, setCoords] = useState(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const base = new Map<string, NearbyStation>(FALLBACK_STATIONS.map((s) => [s.id, s]));

      const { data: remote } = await supabase.from('stations' as never).select('*');
      if (Array.isArray(remote)) {
        for (const r of remote as any[]) {
          const id = String(r.id ?? r.station_id ?? '');
          if (!id) continue;
          base.set(id, {
            id,
            name: r.name ?? r.station_name ?? titleize(id),
            address: r.address ?? r.location ?? 'Address unavailable',
            lat: Number(r.lat ?? r.latitude ?? DEFAULT_LOCATION.lat),
            lng: Number(r.lng ?? r.longitude ?? DEFAULT_LOCATION.lng),
            rating: r.rating ?? null,
          });
        }
      }

      // Merge stations referenced by live products so they are always orderable.
      const { data: products } = await supabase.from('fuel_products').select('station_id');
      for (const p of (products || []) as { station_id: string | null }[]) {
        const id = p.station_id;
        if (!id || base.has(id)) continue;
        base.set(id, {
          id,
          name: titleize(id),
          address: 'Address unavailable',
          lat: DEFAULT_LOCATION.lat,
          lng: DEFAULT_LOCATION.lng,
        });
      }

      if (active) setStations([...base.values()]);
    })();
    return () => {
      active = false;
    };
  }, []);

  const nearby = useMemo(() => {
    return stations
      .map((s) => ({ ...s, distanceKm: haversineKm(coords, { lat: s.lat, lng: s.lng }) }))
      .filter((s) => s.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [stations, coords, radiusKm]);

  return { stations: nearby, allStations: stations, coords, locating };
}

export default useNearbyStations;
