import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Bell, MapPin, Fuel, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { OrderBroadcast, IncomingOrder, AcceptedOrder } from '@/services/OrderBroadcast';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onBack: () => void;
}

// Demo stations — in production this would come from the signed-in station's session.
const DEMO_STATIONS = [
  { id: 'stn-001', name: 'Total Ikeja' },
  { id: 'stn-002', name: 'Mobil Lekki' },
  { id: 'stn-003', name: 'NNPC Yaba' },
];

const StationIncomingOrdersScreen: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const [stationId, setStationId] = useState(DEMO_STATIONS[0].id);
  const [online, setOnline] = useState(true);
  const [orders, setOrders] = useState<IncomingOrder[]>(() => OrderBroadcast.listOrders());
  const [accepted, setAccepted] = useState<Record<string, AcceptedOrder>>(() => {
    const map: Record<string, AcceptedOrder> = {};
    OrderBroadcast.listOrders().forEach((o) => {
      const a = OrderBroadcast.getAcceptance(o.id);
      if (a) map[o.id] = a;
    });
    return map;
  });

  const station = useMemo(
    () => DEMO_STATIONS.find((s) => s.id === stationId) ?? DEMO_STATIONS[0],
    [stationId],
  );

  useEffect(() => {
    const unsub = OrderBroadcast.subscribe((msg) => {
      if (msg.type === 'new-order') {
        setOrders((prev) => [msg.order, ...prev.filter((o) => o.id !== msg.order.id)]);
        if (online) {
          toast({
            title: '🔔 New incoming order',
            description: `${msg.order.quantity}L ${msg.order.fuelType} — tap Accept fast!`,
          });
        }
      } else if (msg.type === 'accept') {
        setAccepted((prev) => ({ ...prev, [msg.accepted.orderId]: msg.accepted }));
      }
    });
    return () => {
      unsub();
    };
  }, [online, toast]);

  const handleAccept = (order: IncomingOrder) => {
    const rec = OrderBroadcast.accept(order.id, station.id, station.name);
    if (!rec) {
      toast({
        title: 'Too slow ⏱️',
        description: 'Another station accepted this order first.',
        variant: 'destructive',
      });
      return;
    }
    setAccepted((prev) => ({ ...prev, [order.id]: rec }));
    toast({
      title: 'Order accepted ✅',
      description: `You will supply ${order.quantity}L ${order.fuelType}.`,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Incoming Orders</h1>
          <p className="text-xs text-muted-foreground">Filling station dashboard</p>
        </div>
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="font-semibold">{station.name}</p>
          </div>
          <Badge variant={online ? 'default' : 'secondary'} className="gap-1">
            <Bell className="h-3 w-3" />
            {online ? 'Online' : 'Offline'}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_STATIONS.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant={s.id === stationId ? 'default' : 'outline'}
              onClick={() => setStationId(s.id)}
            >
              {s.name}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setOnline((v) => !v)}>
            {online ? 'Go offline' : 'Go online'}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Live Requests ({orders.length})
        </h2>
        {orders.length === 0 && (
          <Card className="p-6 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            Waiting for nearby customer requests…
          </Card>
        )}
        {orders.map((o) => {
          const acc = accepted[o.id];
          const mine = acc?.stationId === station.id;
          return (
            <Card key={o.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Fuel className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {o.quantity}L {o.fuelType}
                    </p>
                    <p className="text-sm text-muted-foreground">₦{o.amount.toLocaleString()}</p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.max(0, Math.round((Date.now() - o.createdAt) / 1000))}s
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  {o.address}
                  {o.distanceKm != null && ` • ${o.distanceKm.toFixed(1)} km away`}
                </span>
              </div>

              {acc ? (
                <div
                  className={`flex items-center gap-2 rounded-md p-2 text-sm ${
                    mine ? 'bg-secondary/20 text-secondary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {mine ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Accepted by you — proceed to supply.
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" /> Taken by {acc.stationName}.
                    </>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={!online}
                  onClick={() => handleAccept(o)}
                >
                  Accept Order
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StationIncomingOrdersScreen;
