import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useNearbyVendors, Vendor } from '@/hooks/useNearbyVendors';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Store,
  Truck,
  User,
  Package,
} from 'lucide-react';

/** Vendor discovery: nearest available vendors + direct-contact profile. No ordering. */
const VendorsNearby: React.FC = () => {
  const [radiusKm, setRadiusKm] = React.useState(15);
  const [selected, setSelected] = React.useState<Vendor | null>(null);
  const { vendors, locating, loading, error } = useNearbyVendors(radiusKm);

  if (selected) return <VendorProfile vendor={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Navigation className="h-4 w-4 text-primary" /> Search radius
          </span>
          <span className="text-muted-foreground">{radiusKm} km</span>
        </div>
        <Slider value={[radiusKm]} min={1} max={50} step={1} onValueChange={(v) => setRadiusKm(v[0])} />
        {locating && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Getting your location…
          </p>
        )}
      </Card>

      {loading ? (
        <Card className="p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors…
        </Card>
      ) : error ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Vendor directory unavailable right now.
        </Card>
      ) : vendors.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          No available vendors within {radiusKm} km. Try widening the radius.
        </Card>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {vendors.map((v) => (
            <Card
              key={v.id}
              className="p-4 cursor-pointer border-2 border-border hover:border-primary/50 transition-all"
              onClick={() => setSelected(v)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{v.business_name}</span>
                  </h3>
                  {v.products_sold?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {v.products_sold.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {v.estimated_quantity != null && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Package className="h-3 w-3" /> Est. available: {String(v.estimated_quantity)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {v.delivery_available ? 'Delivery available' : 'No delivery'}
                  </p>
                </div>
                {v.distanceKm != null && (
                  <Badge variant="secondary" className="shrink-0">
                    {v.distanceKm.toFixed(1)} km
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const VendorProfile: React.FC<{ vendor: Vendor; onBack: () => void }> = ({ vendor, onBack }) => {
  const directionsUrl =
    vendor.latitude != null && vendor.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${vendor.latitude},${vendor.longitude}`
      : vendor.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`
        : null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to vendors
      </Button>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" /> {vendor.business_name}
          </h2>
          {vendor.distanceKm != null && (
            <p className="text-xs text-muted-foreground mt-1">{vendor.distanceKm.toFixed(1)} km away</p>
          )}
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          {vendor.owner_name && (
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> {vendor.owner_name}
            </p>
          )}
          {vendor.phone && (
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> {vendor.phone}
            </p>
          )}
          {vendor.address && (
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> {vendor.address}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            {vendor.delivery_available ? 'Delivery available' : 'No delivery'}
          </p>
          {vendor.estimated_quantity != null && (
            <p className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" /> Est. quantity:{' '}
              {String(vendor.estimated_quantity)}
            </p>
          )}
        </div>

        {vendor.products_sold?.length ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Products sold</p>
            <div className="flex flex-wrap gap-1">
              {vendor.products_sold.map((p) => (
                <Badge key={p} variant="outline">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button asChild disabled={!vendor.phone}>
            <a href={vendor.phone ? `tel:${vendor.phone}` : undefined}>
              <Phone className="h-4 w-4 mr-2" /> Call
            </a>
          </Button>
          <Button asChild variant="outline" disabled={!directionsUrl}>
            <a href={directionsUrl ?? undefined} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4 mr-2" /> Get Directions
            </a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Vendors are discovery-only — contact them directly to arrange supply.
        </p>
      </Card>
    </div>
  );
};

export default VendorsNearby;
