import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { haversineKm } from '@/hooks/useNearbyStations';
import {
  PO_STATUS_FLOW,
  POStatus,
  STATUS_META,
  generatePoCode,
  generatePodcCode,
  generatePodcDigits,
  statusIndex,
  CANCELLABLE_UNTIL,
} from '@/lib/purchaseOrders';

export interface PriorityStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm?: number;
}

export interface OrderRider {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
}

export interface ActiveOrder {
  id: string;
  poCode: string;
  status: POStatus;
  productName: string;
  quantity: number;
  unit: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  address: string;
  destination: { lat: number; lng: number };
  serviceLevel: 'standard' | 'fast';
  paymentMethod: string;
  priorityStations: PriorityStation[];
  fulfillingStationId?: string | null;
  assignedDriverId?: string | null;
  podc?: string;
  podcCode?: string;
  rider?: OrderRider;
  createdAt: number;
  cancelled?: boolean;
  rating?: { driver?: number; station?: number };
  backendSynced: boolean;
}

export interface StatusEvent {
  status: POStatus;
  at: number;
}

export interface CreateOrderPayload {
  productName: string;
  quantity: number;
  unit: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  address: string;
  destination: { lat: number; lng: number };
  serviceLevel: 'standard' | 'fast';
  paymentMethod: string;
  priorityStations: PriorityStation[];
}

interface PurchaseOrderContextValue {
  order: ActiveOrder | null;
  statusEvents: StatusEvent[];
  riderPos: { lat: number; lng: number } | null;
  etaMinutes: number | null;
  createPurchaseOrder: (p: CreateOrderPayload) => ActiveOrder;
  submitPodc: (code: string) => Promise<boolean>;
  cancelOrder: () => Promise<void>;
  rateOrder: (rating: { driver?: number; station?: number }) => Promise<void>;
  clearOrder: () => void;
}

const PurchaseOrderContext = createContext<PurchaseOrderContextValue | null>(null);

export const usePurchaseOrder = () => {
  const ctx = useContext(PurchaseOrderContext);
  if (!ctx) throw new Error('usePurchaseOrder must be used within PurchaseOrderProvider');
  return ctx;
};

const FALLBACK_RIDERS: OrderRider[] = [
  { id: 'rider-ahmed', name: 'Ahmed Ibrahim', phone: '+2348012345678', vehicle: 'Toyota Hilux · ABC 123 XY', rating: 4.9 },
  { id: 'rider-chidi', name: 'Chidi Okafor', phone: '+2348098765432', vehicle: 'Honda Ace · EKY 456 ZT', rating: 4.7 },
  { id: 'rider-funke', name: 'Funke Adeyemi', phone: '+2347055512345', vehicle: 'Suzuki Van · LSD 789 QW', rating: 4.8 },
];

const TRANSIT_MS = 75_000;
const FINAL: POStatus[] = ['DELIVERY_VERIFIED', 'COMPLETED'];
const TOAST_ON: POStatus[] = ['LOGISTICS_SELECTED', 'DRIVER_ASSIGNED', 'IN_TRANSIT', 'ARRIVED_AT_CUSTOMER', 'DELIVERY_VERIFIED', 'COMPLETED'];

export const PurchaseOrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const { toast } = useToast();
  const [order, setOrder] = useState<ActiveOrder | null>(null);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [riderPos, setRiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const prevStatus = useRef<POStatus | null>(null);

  const storageKey = userId ? `ff-active-order-${userId}` : null;

  // Restore an in-flight order across reloads.
  useEffect(() => {
    if (!storageKey) {
      setOrder(null);
      setStatusEvents([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { order: ActiveOrder; statusEvents: StatusEvent[] };
        setOrder(parsed.order);
        setStatusEvents(parsed.statusEvents ?? []);
      }
    } catch {
      /* corrupted cache — start fresh */
    }
  }, [storageKey]);

  // Persist.
  useEffect(() => {
    if (!storageKey) return;
    if (order) {
      localStorage.setItem(storageKey, JSON.stringify({ order, statusEvents }));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [order, statusEvents, storageKey]);

  const advanceStatus = useCallback((status: POStatus, patch: Partial<ActiveOrder> = {}) => {
    setStatusEvents((prev) =>
      prev.some((e) => e.status === status) ? prev : [...prev, { status, at: Date.now() }]
    );
    setOrder((prev) => (prev ? { ...prev, status, ...patch } : prev));
  }, []);

  // Status-change toasts.
  useEffect(() => {
    if (!order) {
      prevStatus.current = null;
      return;
    }
    if (prevStatus.current === order.status) return;
    prevStatus.current = order.status;
    if (TOAST_ON.includes(order.status)) {
      const meta = STATUS_META[order.status];
      toast({ title: meta.label, description: meta.description, duration: 5000 });
    }
  }, [order, toast]);

  const createPurchaseOrder = useCallback(
    (p: CreateOrderPayload): ActiveOrder => {
      const now = Date.now();
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `po-${now}-${Math.random().toString(36).slice(2, 8)}`;
      const newOrder: ActiveOrder = {
        id,
        poCode: generatePoCode(),
        status: 'PO_GENERATED',
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        subtotal: p.subtotal,
        deliveryFee: p.deliveryFee,
        totalAmount: p.totalAmount,
        address: p.address,
        destination: p.destination,
        serviceLevel: p.serviceLevel,
        paymentMethod: p.paymentMethod,
        priorityStations: p.priorityStations,
        createdAt: now,
        backendSynced: false,
      };
      setStatusEvents([
        { status: 'CREATED', at: now },
        { status: 'PAID', at: now + 400 },
        { status: 'PO_GENERATED', at: now + 900 },
      ]);
      setOrder(newOrder);
      setRiderPos(null);
      setEtaMinutes(null);

      // Best-effort sync to the shared backend PO tables (if deployed).
      void (async () => {
        try {
          const { error } = await supabase.from('purchase_orders' as never).insert({
            id,
            customer_id: userId,
            po_code: newOrder.poCode,
            status: 'PO_GENERATED',
            payment_status: 'PAID',
            delivery_address: p.address,
            delivery_latitude: p.destination.lat,
            delivery_longitude: p.destination.lng,
          } as never);
          if (error) return;
          await supabase.from('purchase_order_fulfilment_options' as never).insert(
            p.priorityStations.map((s, i) => ({
              purchase_order_id: id,
              partner_id: s.id,
              priority: i + 1,
              status: i === 0 ? 'ACTIVATED' : 'PENDING',
            })) as never
          );
          setOrder((prev) => (prev && prev.id === id ? { ...prev, backendSynced: true } : prev));
        } catch {
          /* backend PO tables not reachable — local realtime simulation continues */
        }
      })();

      return newOrder;
    },
    [userId]
  );

  // Live subscriptions once the order exists server-side.
  useEffect(() => {
    if (!order?.backendSynced) return;
    const ch = supabase
      .channel(`po-${order.id}`)
      // Order status changes (PAID → DRIVER_ASSIGNED → IN_TRANSIT → …).
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'purchase_orders', filter: `id=eq.${order.id}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const st = String(row.status ?? '').toUpperCase() as POStatus;
          const patch: Partial<ActiveOrder> = {};
          if (row.assigned_driver_id) patch.assignedDriverId = String(row.assigned_driver_id);
          if (PO_STATUS_FLOW.includes(st)) advanceStatus(st, patch);
          else if (Object.keys(patch).length) setOrder((prev) => (prev ? { ...prev, ...patch } : prev));
        }
      )
      // PODC receipt appears the moment the backend generates the code.
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'podc_codes', filter: `purchase_order_id=eq.${order.id}` },
        (payload) => {
          const row = (payload.new ?? {}) as Record<string, unknown>;
          if (row.podc_code) {
            const full = String(row.podc_code);
            const digits = full.replace(/\D/g, '').slice(-6) || full;
            setOrder((prev) => (prev ? { ...prev, podc: digits, podcCode: full } : prev));
          }
          if (row.verified_at) advanceStatus('DELIVERY_VERIFIED');
        }
      )
      // 3-station failover: follow whichever partner gets activated.
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'purchase_order_fulfilment_options',
          filter: `purchase_order_id=eq.${order.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const st = String(row.status ?? '').toUpperCase();
          if (st !== 'ACTIVATED' && !row.activated_at) return;
          const partnerId = String(row.partner_id ?? '');
          if (!partnerId) return;
          setOrder((prev) => {
            if (!prev || prev.fulfillingStationId === partnerId) return prev;
            const station = prev.priorityStations.find((s) => s.id === partnerId);
            if (station && prev.fulfillingStationId) {
              toast({
                title: 'Trying your next station',
                description: `${station.name} is now fulfilling your order.`,
              });
            }
            return { ...prev, fulfillingStationId: partnerId };
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [order?.backendSynced, order?.id, advanceStatus, toast]);

  // Fetch the rider profile once the backend assigns a driver.
  useEffect(() => {
    const driverId = order?.assignedDriverId;
    if (!order?.backendSynced || !driverId || order.rider?.id === driverId) return;
    void (async () => {
      const { data } = await supabase
        .from('riders' as never)
        .select('*')
        .eq('id', driverId)
        .maybeSingle();
      const r = data as Record<string, unknown> | null;
      if (!r) return;
      const rider: OrderRider = {
        id: driverId,
        name: String(r.full_name ?? r.name ?? 'Your rider'),
        phone: String(r.phone ?? ''),
        vehicle: String(r.vehicle ?? r.vehicle_type ?? 'Delivery vehicle'),
        rating: Number(r.rating ?? 5),
      };
      setOrder((prev) => (prev && prev.assignedDriverId === driverId ? { ...prev, rider } : prev));
      if (r.current_latitude && r.current_longitude) {
        setRiderPos({ lat: Number(r.current_latitude), lng: Number(r.current_longitude) });
      }
    })();
  }, [order?.backendSynced, order?.assignedDriverId, order?.rider?.id]);

  // Live rider location — subscribe once a driver is assigned.
  useEffect(() => {
    const riderId = order?.rider?.id ?? order?.assignedDriverId;
    if (!order?.backendSynced || !riderId) return;
    const chRiders = supabase
      .channel(`po-rider-${riderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'riders', filter: `id=eq.${riderId}` },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          if (r.current_latitude && r.current_longitude) {
            setRiderPos({ lat: Number(r.current_latitude), lng: Number(r.current_longitude) });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chRiders);
    };
  }, [order?.backendSynced, order?.rider?.id, order?.assignedDriverId]);

  // ETA from live rider position when backend-synced (recomputed on each update).
  useEffect(() => {
    if (!order?.backendSynced || !riderPos) return;
    const km = haversineKm(riderPos, order.destination);
    setEtaMinutes(Math.max(1, Math.round(km * 3)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderPos, order?.backendSynced]);

  // Local realtime simulation when the portal tables aren't live yet.
  useEffect(() => {
    if (!order || order.backendSynced || order.cancelled || FINAL.includes(order.status)) return;
    const clear = () => {
      timers.current.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      timers.current = [];
    };
    clear();
    const t = (fn: () => void, ms: number) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    const first = order.priorityStations[0];
    const origin = first ? { lat: first.lat, lng: first.lng } : order.destination;

    if (order.status === 'PO_GENERATED') {
      t(() => advanceStatus('LOGISTICS_SELECTED', { fulfillingStationId: first?.id ?? null }), 4000);
    } else if (order.status === 'LOGISTICS_SELECTED') {
      t(() => {
        const rider = FALLBACK_RIDERS[Math.floor(Math.random() * FALLBACK_RIDERS.length)];
        setRiderPos(origin);
        advanceStatus('DRIVER_ASSIGNED', { rider });
      }, 4000);
    } else if (order.status === 'DRIVER_ASSIGNED') {
      t(() => {
        const digits = generatePodcDigits();
        const podcCode = generatePodcCode();
        advanceStatus('IN_TRANSIT', { podc: digits, podcCode });
        void supabase
          .from('podc_codes' as never)
          .insert({
            purchase_order_id: order.id,
            customer_id: userId,
            podc_code: podcCode,
            status: 'ACTIVE',
          } as never)
          .then(() => undefined, () => undefined);
      }, 5000);
    } else if (order.status === 'IN_TRANSIT') {
      const start = Date.now();
      const interval = window.setInterval(() => {
        const k = Math.min(1, (Date.now() - start) / TRANSIT_MS);
        const jitter = k < 1 ? (Math.random() - 0.5) * 0.0006 : 0;
        setRiderPos({
          lat: origin.lat + (order.destination.lat - origin.lat) * k + jitter,
          lng: origin.lng + (order.destination.lng - origin.lng) * k + jitter,
        });
        setEtaMinutes(Math.max(0, Math.ceil((TRANSIT_MS - (Date.now() - start)) / 60_000)));
        if (k >= 1) {
          clearInterval(interval);
          advanceStatus('ARRIVED_AT_CUSTOMER');
          setEtaMinutes(0);
        }
      }, 1000);
      timers.current.push(interval);
    } else if (order.status === 'ARRIVED_AT_CUSTOMER' || order.status === 'PODC_SUBMITTED') {
      setEtaMinutes(0);
      setRiderPos(order.destination);
    }

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.status, order?.id, order?.backendSynced, order?.cancelled]);

  const submitPodc = useCallback(
    async (code: string): Promise<boolean> => {
      if (!order?.podc || order.podc !== code.trim()) return false;
      advanceStatus('PODC_SUBMITTED');
      void supabase
        .from('podc_codes' as never)
        .update({
          status: 'VERIFIED',
          submitted_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        } as never)
        .eq('purchase_order_id', order.id)
        .then(() => undefined, () => undefined);
      window.setTimeout(() => advanceStatus('DELIVERY_VERIFIED'), 1200);
      return true;
    },
    [order, advanceStatus]
  );

  const cancelOrder = useCallback(async () => {
    if (!order) return;
    if (statusIndex(order.status) > statusIndex(CANCELLABLE_UNTIL)) return;
    setOrder((prev) => (prev ? { ...prev, cancelled: true } : prev));
    void supabase
      .from('purchase_orders' as never)
      .update({ cancelled: true, status: 'CANCELLED' } as never)
      .eq('id', order.id)
      .then(() => undefined, () => undefined);
    toast({ title: 'Order cancelled', description: `${order.poCode} has been cancelled.` });
  }, [order, toast]);

  const rateOrder = useCallback(
    async (rating: { driver?: number; station?: number }) => {
      if (!order) return;
      setOrder((prev) =>
        prev
          ? { ...prev, rating, status: prev.status === 'DELIVERY_VERIFIED' ? 'COMPLETED' : prev.status }
          : prev
      );
      if (order.status === 'DELIVERY_VERIFIED') {
        setStatusEvents((prev) =>
          prev.some((e) => e.status === 'COMPLETED') ? prev : [...prev, { status: 'COMPLETED', at: Date.now() }]
        );
      }
      void supabase
        .from('purchase_orders' as never)
        .update({ rating_driver: rating.driver ?? null, rating_station: rating.station ?? null, status: 'COMPLETED' } as never)
        .eq('id', order.id)
        .then(() => undefined, () => undefined);
    },
    [order]
  );

  const clearOrder = useCallback(() => {
    setOrder(null);
    setStatusEvents([]);
    setRiderPos(null);
    setEtaMinutes(null);
  }, []);

  return (
    <PurchaseOrderContext.Provider
      value={{
        order,
        statusEvents,
        riderPos,
        etaMinutes,
        createPurchaseOrder,
        submitPodc,
        cancelOrder,
        rateOrder,
        clearOrder,
      }}
    >
      {children}
    </PurchaseOrderContext.Provider>
  );
};
