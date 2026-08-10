import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface StationService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_available: boolean | null;
}

/**
 * Non-fuel services / activities offered at a station (car wash, EV charging,
 * mini mart, etc.) from the shared portal backend.
 *
 * The portal's `services` table has no `station_id` column — rows are scoped by
 * `owner_id` (the station owner's account). We therefore try `owner_id` first
 * and fall back to the station's own id, then to the full available catalogue.
 */
export function useStationServices(stationId?: string) {
  const [services, setServices] = useState<StationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const select = 'id,name,description,category,is_available';

      const run = async (filter?: { column: string; value: string }) => {
        let q = supabase.from('services' as never).select(select).eq('is_available', true);
        if (filter) q = q.eq(filter.column, filter.value);
        return q.order('name', { ascending: true });
      };

      let rows: any[] = [];
      let err: string | null = null;

      if (stationId) {
        const byOwner = await run({ column: 'owner_id', value: stationId });
        if (byOwner.error) err = byOwner.error.message;
        rows = (byOwner.data as any[]) || [];
      }

      if (rows.length === 0) {
        const all = await run();
        if (all.error) err = all.error.message;
        rows = (all.data as any[]) || [];
      }

      if (!active) return;
      setError(err);
      setServices(
        rows.map((r, i) => ({
          id: String(r.id ?? `service-${i}`),
          name: r.name ?? 'Service',
          description: r.description ?? null,
          category: r.category ?? null,
          is_available: r.is_available ?? true,
        }))
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [stationId]);

  return { services, loading, error };
}

export default useStationServices;
