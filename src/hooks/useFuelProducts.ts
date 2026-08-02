import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface FuelProduct {
  id: string;
  station_id: string | null;
  product_name: string;
  price: number | null;
  quantity_available: number | null;
  capacity: number | null;
  is_available: boolean;
  unit: string | null;
  currency: string | null;
  sort_order: number | null;
  created_at?: string | null;
  last_updated_at?: string | null;
}

interface UseFuelProductsOptions {
  /** Only return products flagged available in the portal. Default: true */
  onlyAvailable?: boolean;
  /** Restrict to a single station */
  stationId?: string;
}

/**
 * Live fuel/product availability shared with the Petro Pulse Portal.
 * Backed by public.fuel_products on Supabase project fytksuhwheohqcobuzbk
 * with Realtime subscriptions so portal edits appear instantly.
 */
export function useFuelProducts(options: UseFuelProductsOptions = {}) {
  const { onlyAvailable = true, stationId } = options;
  const [products, setProducts] = useState<FuelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('connecting');
  const mounted = useRef(true);

  const fetchProducts = async () => {
    let query = supabase.from('fuel_products').select('*');
    if (stationId) query = query.eq('station_id', stationId);
    const { data, error: err } = await query.order('sort_order', { ascending: true });

    if (!mounted.current) return;
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setProducts((data || []) as FuelProduct[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    mounted.current = true;
    setLoading(true);
    fetchProducts();

    const channel = supabase
      .channel(`fuel_products_${stationId || 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fuel_products' },
        (payload) => {
          if (!mounted.current) return;
          setLastEventAt(Date.now());
          setProducts((prev) => {
            const row = (payload.new || payload.eventType === 'DELETE' ? payload.new : null) as FuelProduct | null;
            if (payload.eventType === 'DELETE') {
              const old = payload.old as { id?: string };
              return prev.filter((p) => p.id !== old?.id);
            }
            if (!row) return prev;
            if (stationId && row.station_id !== stationId) return prev;
            const idx = prev.findIndex((p) => p.id === row.id);
            if (idx === -1) return [...prev, row];
            const next = [...prev];
            next[idx] = { ...next[idx], ...row };
            return next;
          });
        }
      )
      .subscribe((status) => {
        if (mounted.current) setRealtimeStatus(status);
      });

    return () => {
      mounted.current = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  const visible = useMemo(
    () => (onlyAvailable ? products.filter((p) => p.is_available) : products),
    [products, onlyAvailable]
  );

  return {
    products: visible,
    allProducts: products,
    loading,
    error,
    realtimeStatus,
    lastEventAt,
    refresh: fetchProducts,
  };
}

export default useFuelProducts;
