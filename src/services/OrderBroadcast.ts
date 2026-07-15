// Lightweight order broadcast service (demo).
// Broadcasts customer orders to nearby filling stations and lets the
// fastest station "accept" the request. Uses BroadcastChannel so a
// customer tab and a station tab can talk in real time.

export type IncomingOrder = {
  id: string;
  createdAt: number;
  customer: string;
  fuelType: string;
  quantity: number;
  amount: number;
  address: string;
  distanceKm?: number;
};

export type AcceptedOrder = {
  orderId: string;
  stationId: string;
  stationName: string;
  acceptedAt: number;
};

type Msg =
  | { type: 'new-order'; order: IncomingOrder }
  | { type: 'accept'; accepted: AcceptedOrder }
  | { type: 'cancel'; orderId: string };

const CHANNEL = 'fuelnow-orders';
const STORE_ORDERS = 'fuelnow.incoming-orders';
const STORE_ACCEPTED = 'fuelnow.accepted-orders';

const listeners = new Set<(m: Msg) => void>();
let channel: BroadcastChannel | null = null;

const ensure = () => {
  if (channel || typeof window === 'undefined') return;
  try {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (e) => listeners.forEach((l) => l(e.data as Msg));
  } catch {
    channel = null;
  }
};

const readJSON = <T,>(k: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* ignore */
  }
};

export const OrderBroadcast = {
  subscribe(fn: (m: Msg) => void) {
    ensure();
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  broadcastOrder(order: IncomingOrder) {
    ensure();
    const orders = readJSON<IncomingOrder[]>(STORE_ORDERS, []);
    orders.unshift(order);
    writeJSON(STORE_ORDERS, orders.slice(0, 25));
    channel?.postMessage({ type: 'new-order', order });
  },

  accept(orderId: string, stationId: string, stationName: string): AcceptedOrder | null {
    ensure();
    const accepted = readJSON<AcceptedOrder[]>(STORE_ACCEPTED, []);
    if (accepted.find((a) => a.orderId === orderId)) return null; // already taken
    const record: AcceptedOrder = {
      orderId,
      stationId,
      stationName,
      acceptedAt: Date.now(),
    };
    accepted.unshift(record);
    writeJSON(STORE_ACCEPTED, accepted.slice(0, 50));
    channel?.postMessage({ type: 'accept', accepted: record });
    return record;
  },

  getAcceptance(orderId: string): AcceptedOrder | undefined {
    return readJSON<AcceptedOrder[]>(STORE_ACCEPTED, []).find(
      (a) => a.orderId === orderId,
    );
  },

  listOrders(): IncomingOrder[] {
    return readJSON<IncomingOrder[]>(STORE_ORDERS, []);
  },

  cancel(orderId: string) {
    ensure();
    channel?.postMessage({ type: 'cancel', orderId });
  },
};
