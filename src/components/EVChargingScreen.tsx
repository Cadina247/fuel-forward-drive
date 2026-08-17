import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEvPorts, useEvBookings, type EvPort } from '@/hooks/useEvCharging';
import {
  Zap,
  ArrowLeft,
  MapPin,
  Filter,
  Battery,
  Plug,
  Wifi,
  Loader2,
  CalendarClock,
} from 'lucide-react';

interface EVChargingScreenProps {
  onBack: () => void;
}

const DURATIONS = [30, 60, 90];

const EVChargingScreen: React.FC<EVChargingScreenProps> = ({ onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [busyPortId, setBusyPortId] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const { toast } = useToast();
  const { session, profile } = useAuth();
  const { stations, ports, loading, realtimeStatus } = useEvPorts();
  const { bookings, createBooking } = useEvBookings(session?.user?.id ?? null);

  const bookingByPort = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) {
      if (b.port_id && !map.has(String(b.port_id))) map.set(String(b.port_id), b.status ?? 'pending');
    }
    return map;
  }, [bookings]);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'Available' },
    { id: 'dc-fast', label: 'DC Fast' },
    { id: 'ac-standard', label: 'AC Standard' },
  ];

  const matches = (p: EvPort) => {
    const type = (p.charging_type ?? '').toLowerCase();
    if (selectedFilter === 'available') return !!p.is_available;
    if (selectedFilter === 'dc-fast') return type.includes('dc') || type.includes('fast');
    if (selectedFilter === 'ac-standard') return type.includes('ac') || type.includes('level');
    return true;
  };

  const visibleStations = stations
    .map((s) => ({ ...s, ports: s.ports.filter(matches) }))
    .filter((s) => s.ports.length > 0);

  const availableCount = ports.filter((p) => p.is_available).length;

  const handleBook = async (port: EvPort) => {
    setBusyPortId(port.id);
    const { error } = await createBooking({
      port,
      durationMinutes: duration,
      customerName: profile?.full_name ?? null,
      customerPhone: (profile as any)?.phone ?? null,
    });
    setBusyPortId(null);
    if (error) {
      toast({ title: 'Booking failed', description: error, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Booking sent ⚡',
      description: `${port.port_code ?? 'Port'} — waiting for the station manager to confirm.`,
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">EV Charging</h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Wifi className={`h-3 w-3 ${realtimeStatus === 'SUBSCRIBED' ? 'text-green-600' : 'text-muted-foreground'}`} />
            {realtimeStatus === 'SUBSCRIBED' ? 'Live from station portal' : 'Connecting to live updates…'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">{availableCount}</div>
          <div className="text-sm text-muted-foreground">Ports available now</div>
        </Card>
        <Card className="p-4 text-center">
          <MapPin className="h-8 w-8 text-secondary mx-auto mb-2" />
          <div className="text-2xl font-bold">{stations.length}</div>
          <div className="text-sm text-muted-foreground">Charging stations</div>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter by</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Charging duration</span>
        </div>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <Button key={d} size="sm" variant={duration === d ? 'default' : 'outline'} onClick={() => setDuration(d)}>
              {d} min
            </Button>
          ))}
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visibleStations.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No charging ports published by stations yet. Ports appear here as soon as a station adds them in the portal.
        </Card>
      ) : (
        <div className="space-y-4">
          {visibleStations.map((station) => (
            <Card key={station.ownerId} className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold">{station.name}</h3>
                {station.address && <p className="text-sm text-muted-foreground">{station.address}</p>}
              </div>

              <div className="space-y-3">
                {station.ports.map((port) => {
                  const status = bookingByPort.get(port.id);
                  return (
                    <div key={port.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{port.port_code ?? 'Port'}</div>
                          <div className="text-xs text-muted-foreground">
                            {port.charging_type ?? 'Charging'}
                            {port.connector_type ? ` • ${port.connector_type}` : ''}
                          </div>
                        </div>
                        <Badge variant={port.is_available ? 'default' : 'destructive'}>
                          {port.is_available ? 'Available' : 'Not available'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Battery className="h-4 w-4 text-secondary" />
                            {port.power_kw ? `${port.power_kw} kW` : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Plug className="h-4 w-4 text-primary" />
                            {port.price_per_kwh != null ? `₦${port.price_per_kwh}/kWh` : 'Price on site'}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="energy"
                          disabled={!port.is_available || busyPortId === port.id}
                          onClick={() => handleBook(port)}
                        >
                          {busyPortId === port.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : port.is_available ? (
                            'Book'
                          ) : (
                            'Unavailable'
                          )}
                        </Button>
                      </div>

                      {status && (
                        <div className="text-xs">
                          Your booking:{' '}
                          <span
                            className={
                              status === 'confirmed'
                                ? 'text-green-600 font-medium'
                                : status === 'cancelled' || status === 'rejected'
                                  ? 'text-destructive font-medium'
                                  : 'text-muted-foreground font-medium'
                            }
                          >
                            {status}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {bookings.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">My bookings</h3>
          <div className="space-y-2">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {b.start_time ? new Date(b.start_time).toLocaleString() : 'Scheduled'} • {b.duration_minutes ?? 0} min
                </span>
                <Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status ?? 'pending'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EVChargingScreen;
