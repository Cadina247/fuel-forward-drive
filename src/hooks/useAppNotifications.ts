import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

/**
 * Push / in-app notifications for order + EV booking + EV port changes.
 *
 * The web portal owns the data; this hook only listens to Realtime changes on
 * the shared backend and surfaces them as OS push notifications (when the user
 * granted permission) plus in-app toasts, so nothing needs a manual refresh.
 */

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: number;
  kind: 'order' | 'ev-booking' | 'ev-port';
  read: boolean;
}

const ORDER_MESSAGES: Record<string, string> = {
  pending: 'Your order was received and is awaiting confirmation.',
  accepted: 'A station accepted your order and is preparing it.',
  preparing: 'Your fuel is being prepared for delivery.',
  en_route: 'Your delivery is on the way 🚚',
  'en-route': 'Your delivery is on the way 🚚',
  nearby: 'Your driver is arriving now.',
  delivered: 'Delivered — please confirm with your PODC.',
  confirmed: 'Delivery confirmed. Thank you!',
  completed: 'Order completed. Thank you!',
  cancelled: 'Your order was canceled.',
  canceled: 'Your order was canceled.',
};

const BOOKING_MESSAGES: Record<string, string> = {
  pending: 'Charging booking submitted — awaiting station confirmation.',
  confirmed: 'Your charging booking was confirmed ⚡',
  active: 'Charging session started.',
  completed: 'Charging session completed.',
  cancelled: 'Your charging booking was canceled.',
  canceled: 'Your charging booking was canceled.',
};

export function canNotify() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission() {
  if (!canNotify()) return 'unsupported' as const;
  if (Notification.permission === 'granted') return 'granted' as const;
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied' as const;
  }
}

function pushNative(title: string, body: string) {
  if (!canNotify() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: '/favicon.ico', tag: title });
  } catch {
    /* some browsers require a service worker — the toast still shows */
  }
}

export function useAppNotifications(userId?: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permission, setPermission] = useState<string>(
    canNotify() ? Notification.permission : 'unsupported'
  );
  const seen = useRef(new Set<string>());

  const notify = useCallback((n: Omit<AppNotification, 'id' | 'at' | 'read'>) => {
    const item: AppNotification = {
      ...n,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
      read: false,
    };
    setNotifications((prev) => [item, ...prev].slice(0, 30));
    toast({ title: item.title, description: item.body, duration: 6000 });
    pushNative(item.title, item.body);
  }, []);

  const enablePush = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      notify({
        kind: 'order',
        title: 'Notifications enabled',
        body: "We'll alert you on order and charging updates.",
      });
    }
    return result;
  }, [notify]);

  const markAllRead = useCallback(
    () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    []
  );

  // Order status changes for this customer.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`orders_notify_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as any;
          if (!row?.id) return;
          const status = String(row.status ?? '').toLowerCase();
          const key = `order:${row.id}:${status}`;
          if (seen.current.has(key)) return;
          seen.current.add(key);
          notify({
            kind: 'order',
            title: `Order ${String(row.order_number ?? row.id).slice(0, 10)}`,
            body: ORDER_MESSAGES[status] ?? `Status updated to ${status || 'updated'}.`,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, notify]);

  // EV booking status changes for this customer.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`ev_bookings_notify_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ev_bookings', filter: `customer_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as any;
          if (!row?.id) return;
          const status = String(row.status ?? '').toLowerCase();
          const key = `booking:${row.id}:${status}`;
          if (seen.current.has(key)) return;
          seen.current.add(key);
          notify({
            kind: 'ev-booking',
            title: 'EV charging booking',
            body: BOOKING_MESSAGES[status] ?? `Booking status: ${status || 'updated'}.`,
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, notify]);

  // Charging port availability changes published by the portal.
  useEffect(() => {
    const channel = supabase
      .channel('ev_ports_notify')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ev_ports' },
        (payload) => {
          const row = payload.new as any;
          const old = payload.old as any;
          if (!row?.id || old?.is_available === row.is_available) return;
          notify({
            kind: 'ev-port',
            title: `Charging port ${row.port_code ?? ''}`.trim(),
            body: row.is_available
              ? 'is now available for booking ⚡'
              : 'just became unavailable.',
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [notify]);

  return {
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    permission,
    enablePush,
    markAllRead,
    notify,
  };
}

export default useAppNotifications;
