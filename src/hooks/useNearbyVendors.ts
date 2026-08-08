import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_LOCATION, haversineKm } from '@/hooks/useNearbyStations';

export interface Vendor {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  products_sold: string[] | null;
  estimated_quantity: string | number | null;
  delivery_available: boolean | null;
  is_available: boolean | null;
  distanceKm?: number;
}

/**
 * Vendors from the shared backend, filtered to available ones and sorted by
 * distance from the user (same proximity logic as nearby stations).
 */
export function useNearbyVendors(radiusKm = 15) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [coords, setCoords] = useState(DEFAULT_LOCATION);
  const [locating, setLocating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
      const { data, error: err } = await supabase
        .from('vendors' as never)
        .select('*')
        .eq('is_available', true);
      if (!active) return;
      if (err) setError(err.message);
      else setError(null);
      setVendors(
        ((data as any[]) || []).map((v, i) => ({
          id: String(v.id ?? `vendor-${i}`),
          business_name: v.business_name ?? 'Unnamed vendor',
          owner_name: v.owner_name ?? null,
          phone: v.phone ?? null,
          address: v.address ?? null,
          latitude: v.latitude != null ? Number(v.latitude) : null,
          longitude: v.longitude != null ? Number(v.longitude) : null,
          products_sold: Array.isArray(v.products_sold) ? v.products_sold : null,
          estimated_quantity: v.estimated_quantity ?? null,
          delivery_available: v.delivery_available ?? null,
          is_available: v.is_available ?? null,
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const nearby = useMemo(
    () =>
      vendors
        .map((v) => ({
          ...v,
          distanceKm:
            v.latitude != null && v.longitude != null
              ? haversineKm(coords, { lat: v.latitude, lng: v.longitude })
              : undefined,
        }))
        .filter((v) => v.distanceKm == null || v.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)),
    [vendors, coords, radiusKm]
  );

  return { vendors: nearby, coords, locating, loading, error };
}

export default useNearbyVendors;
