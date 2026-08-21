/**
 * Purchase Order system shared types, status flow and code generators.
 * Mirrors the portal-side tables: purchase_orders,
 * purchase_order_fulfilment_options, podc_codes, riders.
 */

export const PO_STATUS_FLOW = [
  'CREATED',
  'PAID',
  'PO_GENERATED',
  'LOGISTICS_SELECTED',
  'DRIVER_ASSIGNED',
  'IN_TRANSIT',
  'ARRIVED_AT_CUSTOMER',
  'PODC_SUBMITTED',
  'DELIVERY_VERIFIED',
  'COMPLETED',
] as const;

export type POStatus = (typeof PO_STATUS_FLOW)[number];

export const STATUS_META: Record<POStatus, { label: string; description: string }> = {
  CREATED: { label: 'Order created', description: 'We received your order.' },
  PAID: { label: 'Payment confirmed', description: 'Your payment has been verified.' },
  PO_GENERATED: { label: 'Purchase order generated', description: 'Your PO has been issued.' },
  LOGISTICS_SELECTED: {
    label: 'Logistics selected',
    description: 'Fuel Forward is coordinating fulfilment with your selected stations.',
  },
  DRIVER_ASSIGNED: { label: 'Driver assigned', description: 'A rider is heading to the station.' },
  IN_TRANSIT: { label: 'In transit', description: 'Your order is on its way to you.' },
  ARRIVED_AT_CUSTOMER: {
    label: 'Driver arrived',
    description: 'Your driver has arrived at your location.',
  },
  PODC_SUBMITTED: { label: 'PODC submitted', description: 'Verifying proof of delivery…' },
  DELIVERY_VERIFIED: { label: 'Delivery verified', description: 'Delivery confirmed. ✓' },
  COMPLETED: { label: 'Completed', description: 'Order complete. Thank you!' },
};

export const statusIndex = (s: POStatus) => PO_STATUS_FLOW.indexOf(s);

/** Orders can be cancelled up until a driver is assigned. */
export const CANCELLABLE_UNTIL: POStatus = 'DRIVER_ASSIGNED';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');
const ALNUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rand = (n: number) =>
  Array.from({ length: n }, () => ALNUM[Math.floor(Math.random() * ALNUM.length)]).join('');

/** e.g. PO-202608211447-A3F9K2 */
export function generatePoCode(d = new Date()) {
  return `PO-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(
    d.getMinutes()
  )}-${rand(6)}`;
}

/** e.g. PODC-2026082114-K7J2M9Q5 */
export function generatePodcCode(d = new Date()) {
  return `PODC-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(
    d.getHours()
  )}-${rand(8)}`;
}

/** 6-digit delivery code the customer reads to / scans from the driver. */
export function generatePodcDigits() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
