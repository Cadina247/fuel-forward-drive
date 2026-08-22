import React, { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFuelProducts } from '@/hooks/useFuelProducts';
import { NearbyStation } from '@/hooks/useNearbyStations';
import { PriorityStation } from '@/contexts/PurchaseOrderContext';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  GripVertical,
  Home,
  MapPin,
} from 'lucide-react';

interface Props {
  customer: { lat: number; lng: number };
  stations: NearbyStation[];
  initialStationId?: string;
  productName?: string;
  onConfirm: (stations: PriorityStation[]) => void;
}

const PRIORITY_STYLES = [
  { label: 'Priority 1', short: 'P1', dot: 'bg-green-500', border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-700' },
  { label: 'Priority 2', short: 'P2', dot: 'bg-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-700' },
  { label: 'Priority 3', short: 'P3', dot: 'bg-blue-500', border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-700' },
];

const norm = (s?: string | null) => (s ?? '').toLowerCase().trim();

/** Rough fulfilment estimate: prep + drive time. */
const etaFor = (distanceKm?: number) => Math.round(8 + (distanceKm ?? 5) * 3);

const StationPriorityPicker: React.FC<Props> = ({
  customer,
  stations,
  initialStationId,
  productName,
  onConfirm,
}) => {
  const { toast } = useToast();
  const candidates = useMemo(() => stations.slice(0, 8), [stations]);
  const [selected, setSelected] = useState<string[]>(
    initialStationId && candidates.some((s) => s.id === initialStationId) ? [initialStationId] : []
  );

  // Live stock for the chosen product across all stations (shared portal feed).
  const { allProducts } = useFuelProducts({ onlyAvailable: false });
  const stockFor = (stationId: string) => {
    const target = norm(productName);
    if (!target) return null;
    const match = (allProducts as any[]).find(
      (p) => String(p.station_id) === stationId && norm(p.product_name) === target
    );
    return match
      ? {
          available: !!match.is_available,
          qty: match.quantity_available != null ? Number(match.quantity_available) : null,
        }
      : null;
  };

  // Stylized map projection over customer + candidates.
  const project = useMemo(() => {
    const pts = [customer, ...candidates.map((s) => ({ lat: s.lat, lng: s.lng }))];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const pad = 14; // percent
    return (p: { lat: number; lng: number }) => ({
      x: ((p.lng - minLng) / (maxLng - minLng || 1)) * (100 - pad * 2) + pad,
      y: (1 - (p.lat - minLat) / (maxLat - minLat || 1)) * (100 - pad * 2) + pad,
    });
  }, [customer, candidates]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast({ title: 'Three stations max', description: 'Remove one to pick another station.' });
        return prev;
      }
      return [...prev, id];
    });
  };

  // Drag-to-reorder (pointer based) with arrow-button fallback.
  const dragIndex = useRef<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    setSelected((prev) => {
      if (to < 0 || to >= prev.length || from === to) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const onDragMove = (e: React.PointerEvent) => {
    if (dragIndex.current == null) return;
    const y = e.clientY;
    let target = -1;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (y < r.top + r.height / 2 && target === -1) target = i;
    });
    setOverIndex(target === -1 ? selected.length - 1 : target);
  };

  const onDragEnd = () => {
    if (dragIndex.current != null && overIndex != null) move(dragIndex.current, overIndex);
    dragIndex.current = null;
    setOverIndex(null);
  };

  const confirm = () => {
    const list = selected
      .map((id) => candidates.find((s) => s.id === id))
      .filter((s): s is NearbyStation => !!s)
      .map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        distanceKm: s.distanceKm,
      }));
    if (list.length === 0) return;
    onConfirm(list);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select Your Priority Stations</h2>
        <p className="text-xs text-muted-foreground">
          If your first choice can't fulfill, we'll automatically try the next. Tap up to 3 stations
          in priority order.
        </p>
      </div>

      {/* Map */}
      <Card className="p-2">
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-green-100">
          {/* grid lines */}
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:24px_24px] text-primary" />
          {/* customer pin */}
          {(() => {
            const c = project(customer);
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                style={{ left: `${c.x}%`, top: `${c.y}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg ring-2 ring-background">
                  <Home className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-medium bg-background/80 rounded px-1 mt-0.5">You</span>
              </div>
            );
          })()}
          {/* station pins */}
          {candidates.map((s) => {
            const p = project({ lat: s.lat, lng: s.lng });
            const idx = selected.indexOf(s.id);
            const style = idx >= 0 ? PRIORITY_STYLES[idx] : null;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-label={`Select ${s.name}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background transition-all ${
                    style ? `${style.dot} text-white scale-110` : 'bg-muted-foreground/70 text-white'
                  }`}
                >
                  {idx >= 0 ? <span className="text-xs font-bold">{idx + 1}</span> : <MapPin className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 px-2 pt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Priority 1</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400" /> Priority 2</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Priority 3</span>
        </div>
      </Card>

      {/* Station list */}
      <div className="space-y-2">
        {candidates.map((s) => {
          const idx = selected.indexOf(s.id);
          const style = idx >= 0 ? PRIORITY_STYLES[idx] : null;
          const stock = stockFor(s.id);
          return (
            <div
              key={s.id}
              ref={(el) => {
                if (idx >= 0) itemRefs.current[idx] = el;
              }}
              className={overIndex === idx && dragIndex.current != null ? 'translate-y-1' : ''}
            >
              <Card
                className={`p-3 border-2 transition-all cursor-pointer ${
                  style ? `${style.border} ${style.bg}` : 'border-border hover:border-primary/50'
                }`}
                onClick={() => toggle(s.id)}
              >
                <div className="flex items-center gap-3">
                  {style && (
                    <span
                      className={`w-7 h-7 rounded-full ${style.dot} text-white flex items-center justify-center text-xs font-bold shrink-0 cursor-grab active:cursor-grabbing touch-none`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dragIndex.current = idx;
                        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                      }}
                      onPointerMove={onDragMove}
                      onPointerUp={onDragEnd}
                      onPointerCancel={onDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Drag to reorder"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{s.name}</h3>
                      {style && (
                        <Badge variant="secondary" className={`${style.text} shrink-0`}>
                          {style.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.address}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {s.distanceKm?.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> ~{etaFor(s.distanceKm)} min fulfilment
                      </span>
                      {stock ? (
                        stock.available ? (
                          <span className="text-green-600 font-medium">
                            {stock.qty != null ? `${stock.qty.toLocaleString()} in stock` : 'In stock'}
                          </span>
                        ) : (
                          <span className="text-destructive font-medium">Out of stock</span>
                        )
                      ) : (
                        <span>Stock confirmed on assignment</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {idx >= 0 && (
                      <>
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === 0}
                          onClick={() => move(idx, idx - 1)}
                          aria-label="Move up"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          disabled={idx === selected.length - 1}
                          onClick={() => move(idx, idx + 1)}
                          aria-label="Move down"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        style ? `${style.border} ${style.dot}` : 'border-muted-foreground/40'
                      }`}
                    >
                      {style && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      <Button variant="fuel" size="xl" className="w-full" disabled={selected.length === 0} onClick={confirm}>
        Confirm Priorities ({selected.length}/3)
      </Button>
    </div>
  );
};

export default StationPriorityPicker;
