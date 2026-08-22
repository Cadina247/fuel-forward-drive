import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { usePurchaseOrder } from '@/contexts/PurchaseOrderContext';
import { CheckCircle2, Copy, Home, MapPin, Share2, Truck } from 'lucide-react';

interface Props {
  onTrack: () => void;
  onHome: () => void;
}

const PRIORITY_STYLES = [
  { label: 'Priority 1', dot: 'bg-green-500' },
  { label: 'Priority 2', dot: 'bg-yellow-400' },
  { label: 'Priority 3', dot: 'bg-blue-500' },
];

const PurchaseOrderConfirmation: React.FC<Props> = ({ onTrack, onHome }) => {
  const { order } = usePurchaseOrder();
  const { toast } = useToast();

  if (!order) {
    return (
      <div className="p-4 space-y-4">
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No purchase order found. Place an order first.
        </Card>
        <Button variant="outline" className="w-full" onClick={onHome}>
          <Home className="h-4 w-4 mr-2" /> Back to Home
        </Button>
      </div>
    );
  }

  const share = async () => {
    const text = `Fuel Forward Purchase Order ${order.poCode} — ${order.productName} (${order.quantity}${order.unit}) · ₦${order.totalAmount.toLocaleString()}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Purchase Order', text });
        return;
      } catch {
        /* user dismissed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'PO code copied', description: order.poCode });
    } catch {
      toast({ title: 'Copy failed', description: 'Long-press the code to copy it.' });
    }
  };

  return (
    <div className="p-4 space-y-5">
      {/* Success banner */}
      <Card className="p-6 bg-green-600 border-green-600 text-white text-center space-y-2">
        <CheckCircle2 className="h-14 w-14 mx-auto" />
        <h1 className="text-2xl font-bold">Order Confirmed! ✓</h1>
        <p className="text-sm text-green-50">Your Purchase Order is being coordinated</p>
      </Card>

      {/* PO details */}
      <Card className="p-4 space-y-3">
        <div className="text-center pb-1">
          <p className="text-xs text-muted-foreground">PO Code</p>
          <p className="text-xl font-mono font-bold text-primary">{order.poCode}</p>
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Product</span>
            <span className="font-medium">{order.productName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span className="font-medium">
              {order.quantity}
              {order.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Price</span>
            <span className="font-semibold text-primary">₦{order.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground shrink-0">Delivery Address</span>
            <span className="font-medium text-right">{order.address}</span>
          </div>
        </div>

        {order.priorityStations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Priority Stations</p>
              {order.priorityStations.map((s, i) => {
                const style = PRIORITY_STYLES[i] ?? PRIORITY_STYLES[2];
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0`} />
                    <span className="text-muted-foreground w-16 shrink-0">{style.label}</span>
                    <span className="font-medium truncate">{s.name}</span>
                    {s.distanceKm != null && (
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {s.distanceKm.toFixed(1)} km
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="flex items-start gap-2 bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground">
          <Truck className="h-4 w-4 shrink-0 mt-0.5" />
          Fuel Forward is now coordinating with your selected stations to fulfill this order.
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" size="lg" className="w-full" onClick={share}>
          <Share2 className="h-5 w-5 mr-2" /> Share PO Code
        </Button>
        <Button variant="fuel" size="xl" className="w-full" onClick={onTrack}>
          <MapPin className="h-5 w-5 mr-2" /> Track Order
        </Button>
        <Button variant="ghost" className="w-full" onClick={onHome}>
          <Home className="h-4 w-4 mr-2" /> Back to Home
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        <Copy className="h-3 w-3" /> Keep your PO code handy for support.
      </p>
    </div>
  );
};

export default PurchaseOrderConfirmation;
