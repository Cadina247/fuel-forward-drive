import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrder } from '@/contexts/PurchaseOrderContext';
import { PO_STATUS_FLOW, STATUS_META, statusIndex, CANCELLABLE_UNTIL } from '@/lib/purchaseOrders';
import PodcReceipt from '@/components/PodcReceipt';
import DriverContactSheet from '@/components/DriverContactSheet';
import {
  ArrowLeft,
  Bike,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Home,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  User,
  XCircle,
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onHome: () => void;
}

const LiveOrderTracking: React.FC<Props> = ({ onBack, onHome }) => {
  const { order, statusEvents, riderPos, etaMinutes, submitPodc, cancelOrder, rateOrder, clearOrder } =
    usePurchaseOrder();
  const { toast } = useToast();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactTab, setContactTab] = useState<'call' | 'chat'>('call');
  const [podcInput, setPodcInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [rating, setRating] = useState<{ driver?: number; station?: number }>({});

  const eventAt = useMemo(() => {
    const map = new Map(statusEvents.map((e) => [e.status, e.at]));
    return (s: string) => map.get(s as never);
  }, [statusEvents]);

  if (!order) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Track Order</h1>
        </div>
        <Card className="p-6 text-center space-y-2">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No active order</p>
          <p className="text-sm text-muted-foreground">
            Place a fuel order and your live tracking will appear here.
          </p>
        </Card>
        <Button variant="fuel" size="lg" className="w-full" onClick={onHome}>
          <Home className="h-4 w-4 mr-2" /> Order Fuel
        </Button>
      </div>
    );
  }

  const currentIdx = statusIndex(order.status);
  const isFinal = order.status === 'DELIVERY_VERIFIED' || order.status === 'COMPLETED';
  const canCancel = !order.cancelled && !isFinal && currentIdx <= statusIndex(CANCELLABLE_UNTIL);
  const fulfillingStation =
    order.priorityStations.find((s) => s.id === order.fulfillingStationId) ?? order.priorityStations[0];

  // --- Map projection (origin station → customer, rider live dot) ---
  const origin = fulfillingStation
    ? { lat: fulfillingStation.lat, lng: fulfillingStation.lng }
    : order.destination;
  const mapPoints = [order.destination, origin, ...(riderPos ? [riderPos] : [])];
  const lats = mapPoints.map((p) => p.lat);
  const lngs = mapPoints.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const pad = 16;
  const project = (p: { lat: number; lng: number }) => ({
    x: ((p.lng - minLng) / (maxLng - minLng || 1)) * (100 - pad * 2) + pad,
    y: (1 - (p.lat - minLat) / (maxLat - minLat || 1)) * (100 - pad * 2) + pad,
  });
  const destPt = project(order.destination);
  const originPt = project(origin);
  const riderPt = riderPos ? project(riderPos) : null;

  const openContact = (tab: 'call' | 'chat') => {
    setContactTab(tab);
    setContactOpen(true);
  };

  const verify = async () => {
    const code = podcInput.trim();
    if (!code) return;
    setVerifying(true);
    setVerifyError(null);
    // Accept the 6-digit code or the full PODC string (case-insensitive).
    const matches =
      code === order.podc || code.toUpperCase() === (order.podcCode ?? '').toUpperCase();
    const ok = matches && (await submitPodc(order.podc ?? code));
    setVerifying(false);
    if (!ok) {
      setVerifyError("That code doesn't match this delivery. Check with your driver and try again.");
      return;
    }
    toast({ title: 'PODC verified ✓', description: 'Confirming your delivery…' });
  };

  const cancel = async () => {
    await cancelOrder();
    onHome();
  };

  const submitRating = async () => {
    await rateOrder(rating);
    toast({ title: 'Thanks for your feedback!', description: 'Your rating helps us improve.' });
  };

  const stars = (key: 'driver' | 'station') => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => setRating((r) => ({ ...r, [key]: n }))}
          aria-label={`Rate ${key} ${n} stars`}
        >
          <Star
            className={`h-6 w-6 ${
              (rating[key] ?? 0) >= n ? 'text-yellow-400 fill-current' : 'text-muted-foreground/40'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Track Order</h1>
          <p className="text-xs font-mono text-muted-foreground truncate">{order.poCode}</p>
        </div>
        <Badge variant="secondary" className="ml-auto shrink-0">
          {STATUS_META[order.status].label}
        </Badge>
      </div>

      {order.cancelled && (
        <Card className="p-4 border-destructive/40 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Order cancelled</p>
            <p className="text-muted-foreground text-xs">This order will not be delivered.</p>
          </div>
        </Card>
      )}

      {/* Delivery confirmed receipt */}
      {isFinal && (
        <Card className="p-6 bg-green-600 border-green-600 text-white text-center space-y-3">
          <CheckCircle2 className="h-14 w-14 mx-auto" />
          <h2 className="text-2xl font-bold">Delivery Confirmed! ✓</h2>
          <p className="text-sm text-green-50">
            {order.quantity}
            {order.unit} {order.productName} — ₦{order.totalAmount.toLocaleString()}
          </p>
          <p className="text-xs font-mono text-green-100">{order.poCode}</p>
        </Card>
      )}

      {/* Status timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Order Status</h3>
        <div className="space-y-1">
          {PO_STATUS_FLOW.map((st, i) => {
            const done = i < currentIdx || isFinal;
            const current = i === currentIdx && !isFinal && !order.cancelled;
            const at = eventAt(st);
            return (
              <div key={st} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      done
                        ? 'bg-green-600 text-white'
                        : current
                          ? 'bg-primary text-primary-foreground animate-pulse'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                  </div>
                  {i < PO_STATUS_FLOW.length - 1 && (
                    <div className={`w-0.5 h-6 ${i < currentIdx ? 'bg-green-600' : 'bg-muted'}`} />
                  )}
                </div>
                <div className="pb-2 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${done || current ? '' : 'text-muted-foreground'}`}>
                      {STATUS_META[st].label}
                    </p>
                    {at && (
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {current && <p className="text-xs text-muted-foreground">{STATUS_META[st].description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live map */}
      {!isFinal && !order.cancelled && (
        <Card className="p-2">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-green-100">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:24px_24px] text-primary" />
            {/* route line */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line
                x1={originPt.x}
                y1={originPt.y}
                x2={destPt.x}
                y2={destPt.y}
                stroke="currentColor"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                className="text-primary/60"
              />
            </svg>
            {/* origin station */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
              style={{ left: `${originPt.x}%`, top: `${originPt.y}%` }}
            >
              <div className="w-7 h-7 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow ring-2 ring-background">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] bg-background/80 rounded px-1 mt-0.5 max-w-[90px] truncate">
                {fulfillingStation?.name ?? 'Station'}
              </span>
            </div>
            {/* customer pin */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
              style={{ left: `${destPt.x}%`, top: `${destPt.y}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-2 ring-background">
                <Home className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium bg-background/80 rounded px-1 mt-0.5">You</span>
            </div>
            {/* rider dot */}
            {riderPt && (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-linear"
                style={{ left: `${riderPt.x}%`, top: `${riderPt.y}%` }}
              >
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping" />
                  <div className="relative w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-2 ring-background">
                    <Truck className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between px-2 pt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {etaMinutes != null
                ? etaMinutes <= 0
                  ? 'Driver is arriving now'
                  : `Estimated arrival: ${etaMinutes} min${etaMinutes === 1 ? '' : 's'}`
                : 'ETA appears once your driver is on the way'}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </div>
        </Card>
      )}

      {/* Driver card */}
      {order.rider && !order.cancelled && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Your Driver</h3>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => openContact('call')}
              aria-label={`Contact ${order.rider.name}`}
              className="relative w-14 h-14 bg-muted rounded-full flex items-center justify-center hover:ring-2 hover:ring-primary transition-all shrink-0"
            >
              <User className="h-7 w-7 text-muted-foreground" />
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{order.rider.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{order.rider.vehicle}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3 text-yellow-500 fill-current" /> {order.rider.rating.toFixed(1)}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => openContact('call')}>
                <Phone className="h-4 w-4 mr-1" /> Call
              </Button>
              <Button variant="outline" size="sm" onClick={() => openContact('chat')}>
                <MessageSquare className="h-4 w-4 mr-1" /> Message
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* PODC receipt (once generated) */}
      {order.podc && !isFinal && !order.cancelled && (
        <PodcReceipt digits={order.podc} fullCode={order.podcCode} />
      )}

      {/* Delivery confirmation (driver arrived) */}
      {order.status === 'ARRIVED_AT_CUSTOMER' && !order.cancelled && (
        <Card className="p-4 border-primary/50 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Driver has arrived!</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter the Proof of Delivery Code your driver provided to confirm receipt.
          </p>
          <Input
            value={podcInput}
            onChange={(e) => setPodcInput(e.target.value)}
            placeholder="6-digit code or full PODC"
            inputMode="text"
            autoComplete="one-time-code"
            className="text-center text-lg font-mono tracking-[0.3em]"
            maxLength={24}
          />
          {verifyError && <p className="text-sm text-destructive">{verifyError}</p>}
          <Button variant="fuel" size="xl" className="w-full" disabled={verifying || !podcInput.trim()} onClick={verify}>
            <ShieldCheck className="h-5 w-5 mr-2" />
            {verifying ? 'Verifying…' : 'Verify Code'}
          </Button>
        </Card>
      )}

      {/* Rating (after delivery) */}
      {order.status === 'DELIVERY_VERIFIED' && !order.rating && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Rate Driver & Station</h3>
          <div className="flex items-center justify-between text-sm">
            <span>{order.rider?.name ?? 'Driver'}</span>
            {stars('driver')}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{fulfillingStation?.name ?? 'Station'}</span>
            {stars('station')}
          </div>
          <Button
            variant="fuel"
            className="w-full"
            disabled={!rating.driver && !rating.station}
            onClick={submitRating}
          >
            Submit Rating
          </Button>
        </Card>
      )}

      {isFinal && (
        <Button
          variant="fuel"
          size="xl"
          className="w-full"
          onClick={() => {
            clearOrder();
            onHome();
          }}
        >
          <Home className="h-5 w-5 mr-2" /> Done
        </Button>
      )}

      {/* Collapsible order summary */}
      <Card className="p-4">
        <button
          type="button"
          className="w-full flex items-center justify-between"
          onClick={() => setSummaryOpen((v) => !v)}
        >
          <h3 className="font-semibold">Order Summary</h3>
          {summaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {summaryOpen && (
          <div className="space-y-2 text-sm mt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">PO Code</span>
              <span className="font-mono font-medium">{order.poCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">
                {order.productName} ({order.quantity}
                {order.unit})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-medium">
                {order.deliveryFee === 0 ? 'Free' : `₦${order.deliveryFee.toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₦{order.totalAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground shrink-0">Address</span>
              <span className="font-medium text-right">{order.address}</span>
            </div>
            {order.priorityStations.length > 0 && (
              <div className="pt-1 space-y-1">
                <p className="text-xs text-muted-foreground">Priority stations</p>
                {order.priorityStations.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-400' : 'bg-blue-500'
                      }`}
                    />
                    <span className={s.id === order.fulfillingStationId ? 'font-semibold' : ''}>
                      {s.name}
                      {s.id === order.fulfillingStationId ? ' · fulfilling' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Cancel */}
      {canCancel && (
        <Button variant="destructive" size="lg" className="w-full" onClick={cancel}>
          <XCircle className="h-5 w-5 mr-2" /> Cancel Order
        </Button>
      )}

      <DriverContactSheet
        open={contactOpen}
        onOpenChange={setContactOpen}
        driver={{
          name: order.rider?.name ?? 'Your driver',
          phone: order.rider?.phone ?? '',
          vehicle: order.rider?.vehicle ?? '',
          rating: order.rider?.rating ?? 5,
          isOnline: true,
          etaMinutes: etaMinutes ?? undefined,
        }}
        defaultTab={contactTab}
      />
    </div>
  );
};

export default LiveOrderTracking;
