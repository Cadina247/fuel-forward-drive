import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, MapPin, CreditCard, Fuel } from 'lucide-react';
import { OrderBroadcast, IncomingOrder, AcceptedOrder } from '@/services/OrderBroadcast';
import { useToast } from '@/hooks/use-toast';

interface Props {
  order: IncomingOrder;
  onPaid: (podc: string, station: AcceptedOrder) => void;
  onCancel: () => void;
}

const OrderAwaitingScreen: React.FC<Props> = ({ order, onPaid, onCancel }) => {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState<AcceptedOrder | null>(
    () => OrderBroadcast.getAcceptance(order.id) ?? null,
  );
  const [paying, setPaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = OrderBroadcast.subscribe((m) => {
      if (m.type === 'accept' && m.accepted.orderId === order.id) {
        setAccepted(m.accepted);
        toast({
          title: `✅ ${m.accepted.stationName} accepted your order`,
          description: 'Proceed to secure payment.',
        });
      }
    });
    return () => {
      unsub();
    };
  }, [order.id, toast]);

  const handlePay = async () => {
    if (!accepted) return;
    setPaying(true);
    // Simulated payment gateway call
    await new Promise((r) => setTimeout(r, 1500));
    const podc = Math.floor(100000 + Math.random() * 900000).toString();
    setPaying(false);
    onPaid(podc, accepted);
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Fuel className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">
              {order.quantity}L {order.fuelType}
            </p>
            <p className="text-sm text-muted-foreground">
              ₦{order.amount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2 pt-2">
          <MapPin className="h-4 w-4" /> {order.address}
        </div>
      </Card>

      {!accepted ? (
        <Card className="p-6 text-center space-y-3">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Notifying nearby stations…</h2>
            <p className="text-sm text-muted-foreground">
              The fastest station to accept will supply your order.
            </p>
          </div>
          <Badge variant="outline">Waiting {elapsed}s</Badge>
          <Button variant="outline" className="w-full" onClick={onCancel}>
            Cancel Request
          </Button>
        </Card>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-secondary">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold">{accepted.stationName} accepted</p>
              <p className="text-xs text-muted-foreground">
                Confirm payment to release the order.
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">₦{order.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gateway</span>
              <span className="font-medium">FuelNow Pay</span>
            </div>
          </div>

          <Button className="w-full" onClick={handlePay} disabled={paying}>
            {paying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay ₦{order.amount.toLocaleString()}
              </>
            )}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onCancel} disabled={paying}>
            Cancel
          </Button>
        </Card>
      )}
    </div>
  );
};

export default OrderAwaitingScreen;
