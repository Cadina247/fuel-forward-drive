import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Live EV charging data from the shared backend that the web portal manages.
 * The portal owns `ev_ports` (per-port config + availability) and `ev_bookings`
 * (customer bookings + manager confirmations). This app only reads them and
 * inserts bookings — it never maintains its own copy.
 */

export interface EvPort {
  id: string;
  owner_id: string | null;
  port_code: string | null;
  charging_type: string | null;
  connector_type: string | null;
  power_kw: number | null;
  price_per_kwh: number | null;
  currency: string | null;
  is_available: boolean | null;
  sort_order: number | null;
  updated_at?: string | null;
  /** Station name resolved from `stations` (portal owner account). */
  station_name?: string;
  station_address?: string | null;
}

export interface EvBooking {
  id: string;
  customer_id: string | null;
  port_id: string | null;
  owner_id: string | null;
  status: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  amount: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** All charging ports published by stations in the portal, kept live. */
export function useEvPorts() {
  const [ports, setPorts] = useState<EvPort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const mounted = useRef(true);

  const load = useCallback(async () => {
    const [{ data, error: err }, { data: stations }] = await Promise.all([
      supabase.from('ev_ports' as never).select('*').order('sort_order', { ascending: true }),
      supabase.from('stations' as never).select('id,station_name,address'),
    ]);
    if (!mounted.current) return;
    if (err) setError(err.message);
    else setError(null);

    const stationById = new Map<string, { name: string; address: string | null }>();
    for (const s of ((stations as any[]) || [])) {
      stationById.set(String(s.id), {
        name: s.station_name ?? 'Station',
        address: s.address ?? null,
      });
    }

    setPorts(
      ((data as any[]) || []).map((p) => {
        const st = p.owner_id ? stationById.get(String(p.owner_id)) : undefined;
        return {
          id: String(p.id),
          owner_id: p.owner_id ?? null,
          port_code: p.port_code ?? null,
          charging_type: p.charging_type ?? null,
          connector_type: p.connector_type ?? null,
          power_kw: p.power_kw != null ? Number(p.power_kw) : null,
          price_per_kwh: p.price_per_kwh != null ? Number(p.price_per_kwh) : null,
          currency: p.currency ?? 'NGN',
          is_available: p.is_available ?? false,
          sort_order: p.sort_order ?? null,
          updated_at: p.updated_at ?? null,
          station_name: st?.name ?? 'Charging Station',
          station_address: st?.address ?? null,
        } as EvPort;
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    load();

    const channel = supabase
      .channel('ev_ports_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ev_ports' }, () => {
        // Port config/availability changed in the portal — refresh immediately.
        load();
      })
      .subscribe((status) => {
        if (mounted.current) setRealtimeStatus(status);
      });

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [load]);

  const stations = useMemo(() => {
    const groups = new Map<string, { ownerId: string; name: string; address: string | null; ports: EvPort[] }>();
    for (const p of ports) {
      const key = p.owner_id ?? 'unknown';
      if (!groups.has(key)) {
        groups.set(key, {
          ownerId: key,
          name: p.station_name ?? 'Charging Station',
          address: p.station_address ?? null,
          ports: [],
        });
      }
      groups.get(key)!.ports.push(p);
    }
    return [...groups.values()];
  }, [ports]);

  return { ports, stations, loading, error, realtimeStatus, refresh: load };
}

/** The signed-in customer's own bookings, updated live as the portal changes status. */
export function useEvBookings(customerId?: string | null) {
  const [bookings, setBookings] = useState<EvBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (!customerId) {
      setBookings([]);
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('ev_bookings' as never)
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (!mounted.current) return;
    if (err) setError(err.message);
    else setError(null);
    setBookings(((data as any[]) || []) as EvBooking[]);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    load();
    if (!customerId) return;

    const channel = supabase
      .channel(`ev_bookings_${customerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ev_bookings', filter: `customer_id=eq.${customerId}` },
        () => load()
      )
      .subscribe();

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [customerId, load]);

  const createBooking = useCallback(
    async (input: {
      port: EvPort;
      durationMinutes: number;
      startTime?: Date;
      customerName?: string | null;
      customerPhone?: string | null;
      notes?: string | null;
    }) => {
      if (!customerId) return { error: 'Please sign in to book a charging port.' };
      if (!input.port.is_available) return { error: 'This port is currently unavailable.' };

      const estimatedKwh = ((input.port.power_kw ?? 0) * input.durationMinutes) / 60;
      const amount = Math.round(estimatedKwh * (input.port.price_per_kwh ?? 0));

      const { error: err } = await supabase.from('ev_bookings' as never).insert({
        customer_id: customerId,
        port_id: input.port.id,
        owner_id: input.port.owner_id,
        status: 'pending',
        start_time: (input.startTime ?? new Date()).toISOString(),
        duration_minutes: input.durationMinutes,
        amount,
        customer_name: input.customerName ?? null,
        customer_phone: input.customerPhone ?? null,
        notes: input.notes ?? null,
      } as never);

      if (err) return { error: err.message };
      await load();
      return { error: null };
    },
    [customerId, load]
  );

  return { bookings, loading, error, refresh: load, createBooking };
}
