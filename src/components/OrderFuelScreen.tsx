import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VendorsNearby from '@/components/VendorsNearby';

import { useFuelProducts } from '@/hooks/useFuelProducts';
import { useNearbyStations, NearbyStation } from '@/hooks/useNearbyStations';
import { useHyperlocalProviders, ServiceLevel, RankedProvider } from '@/hooks/useHyperlocalProviders';
import { useWallet } from '@/hooks/useWallet';
import {

  Fuel,
  MapPin,
  Star,
  CreditCard,
  ArrowLeft,
  Plus,
  Minus,
  RadioTower,
  Loader2,
  AlertTriangle,
  Wallet,
  Navigation,
  CheckCircle2,
  Clock,
  Zap,
  Bike,
} from 'lucide-react';


interface OrderFuelScreenProps {
  onBack: () => void;
  onPlaceOrder: (orderData: any) => void;
  onStationClick?: (stationId: string) => void;
  onFundWallet?: () => void;
}


type Step = 'browse' | 'products' | 'delivery' | 'checkout';

/** National reference prices (informational only). */
const NATIONAL_PRICES = [
  { id: 'petrol', name: 'Petrol (PMS)', price: 617, unit: 'L', icon: '⛽' },
  { id: 'diesel', name: 'Diesel (AGO)', price: 1150, unit: 'L', icon: '🚛' },
  { id: 'kerosene', name: 'Kerosene (DPK)', price: 1300, unit: 'L', icon: '🪔' },
  { id: 'gas', name: 'Cooking Gas (LPG)', price: 1200, unit: 'kg', icon: '🔥' },
];

const unitForProduct = (name?: string | null, unit?: string | null) => {
  const n = (name || '').toLowerCase();
  if (n.includes('gas') || n.includes('lpg') || n.includes('cooking')) return 'kg';
  return unit && unit.toLowerCase() !== 'kg' ? unit : 'L';
};

const STEP_LABELS: Record<Step, string> = {
  browse: 'Choose Station',
  products: 'Select Product',
  delivery: 'Delivery Details',
  checkout: 'Checkout',
};

const OrderFuelScreen: React.FC<OrderFuelScreenProps> = ({ onBack, onPlaceOrder, onStationClick, onFundWallet }) => {
  const [step, setStep] = useState<Step>('browse');
  const [radiusKm, setRadiusKm] = useState(15);
  const [station, setStation] = useState<NearbyStation | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(20);
  const [address, setAddress] = useState('15 Admiralty Way, Lekki Phase 1, Lagos');
  const [deliveryProvider, setDeliveryProvider] = useState<'in-house' | 'partner'>('partner');
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>('standard');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [reassignedFrom, setReassignedFrom] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'pending' | 'paid'>('idle');
  const [walletError, setWalletError] = useState<string | null>(null);

  const { wallet, balance, loading: walletLoading, spend } = useWallet();

  const { stations, locating, coords } = useNearbyStations(radiusKm);

  // Hyperlocal partners already operating around the customer, ranked by
  // proximity, workload, reliability and price for the chosen service level.
  const { providers: rankedProviders, loading: providersLoading } = useHyperlocalProviders({
    customer: coords,
    station: station ? { lat: station.lat, lng: station.lng } : null,
    serviceLevel,
  });

  // Station-scoped live products from the shared backend.
  const { allProducts, loading: productsLoading, error: productsError, realtimeStatus, lastEventAt } =
    useFuelProducts({ onlyAvailable: false, stationId: station?.id });

  const stationProducts = useMemo(
    () => allProducts.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [allProducts]
  );
  const availableProducts = stationProducts.filter((p) => p.is_available);
  const product = stationProducts.find((p) => p.id === selectedProductId) || null;
  const productUnavailable = !!product && !product.is_available;

  // Drop a selection that the portal just made unavailable.
  useEffect(() => {
    if (productUnavailable && step !== 'products') setStep('products');
  }, [productUnavailable, step]);

  const selectedProvider: RankedProvider | null =
    rankedProviders.find((p) => p.id === providerId) ?? null;

  // Ranking engine → customer preference → automatic fallback.
  useEffect(() => {
    if (providersLoading || rankedProviders.length === 0) return;
    if (!providerId) {
      setProviderId(rankedProviders[0].id);
      return;
    }
    if (!rankedProviders.some((p) => p.id === providerId)) {
      setReassignedFrom(providerId);
      setProviderId(rankedProviders[0].id);
    }
  }, [rankedProviders, providerId, providersLoading]);

  const unit = unitForProduct(product?.product_name, product?.unit);
  const pricePerUnit = Number(product?.price ?? 0);
  const subtotal = pricePerUnit * quantity;
  const deliveryFee =
    deliveryProvider === 'in-house'
      ? subtotal > 20000
        ? 0
        : 500
      : selectedProvider?.fee ?? 0;
  const total = subtotal + deliveryFee;

  const goBack = () => {
    if (step === 'browse') return onBack();
    if (step === 'products') return setStep('browse');
    if (step === 'delivery') return setStep('products');
    return setStep('delivery');
  };

  const emitOrder = (paymentStatus: 'pending' | 'paid') => {
    if (!product || !station) return;
    onPlaceOrder({
      fuelType: { id: product.id, name: product.product_name, price: pricePerUnit, unit },
      station: { id: station.id, name: station.name },
      quantity,
      unit,
      address,
      distanceKm: station.distanceKm,
      serviceLevel,
      deliveryProvider:
        deliveryProvider === 'in-house' || !selectedProvider
          ? { id: 'in-house', name: 'Station Delivery', isInHouse: true }
          : {
              id: selectedProvider.id,
              name: selectedProvider.name,
              isInHouse: false,
              phone: selectedProvider.phone,
              pickupMinutes: selectedProvider.pickupMinutes,
              distanceKm: selectedProvider.distanceKm,
              logisticsKm: selectedProvider.logisticsKm,
            },
      deliveryFee,
      totalAmount: total,
      paymentMethod,
      paymentStatus: 'pending',
      walletPaid: paymentStatus === 'paid',
      timestamp: new Date().toISOString(),
    });
  };


  const handlePay = async () => {
    if (!product || !station) return;

    if (paymentMethod === 'wallet') {
      if (walletLoading || !wallet) return;
      if (balance < total) return;
      setPaymentState('processing');
      try {
        await spend(total, `Fuel order — ${product.product_name} (${quantity}${unit}) @ ${station.name}`);
        setPaymentState('paid');
        emitOrder('paid');
      } catch (e: any) {
        setPaymentState('idle');
        setWalletError(e.message || 'Wallet payment failed');
      }
      return;
    }

    setPaymentState('processing');
    setTimeout(() => {
      setPaymentState('pending');
      emitOrder('pending');
    }, 1200);
  };


  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Order Fuel</h1>
          <p className="text-xs text-muted-foreground">{STEP_LABELS[step]}</p>
        </div>
      </div>

      {/* STEP 1 + 2 */}
      {step === 'browse' && (
        <Tabs defaultValue="stations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stations">Filling Stations</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

          <TabsContent value="stations" className="space-y-6">
          {/* National Fuel Price — reference only */}
          <div className="space-y-3">

            <div>
              <h2 className="text-lg font-semibold">National Fuel Price</h2>
              <p className="text-xs text-muted-foreground">Reference prices only — pick a station below to order.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {NATIONAL_PRICES.map((p) => (
                <Card key={p.id} className="p-4">
                  <div className="text-center space-y-1">
                    <div className="text-2xl">{p.icon}</div>
                    <h3 className="font-medium text-sm">{p.name}</h3>
                    <p className="text-primary font-semibold">₦{p.price.toLocaleString()}/{p.unit}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Choose Station */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Choose Station</h2>
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

            {stations.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">
                No stations within {radiusKm} km. Try widening the radius.
              </Card>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {stations.map((s) => (
                  <Card
                    key={s.id}
                    className="p-4 cursor-pointer border-2 border-border hover:border-primary/50 transition-all"
                    onClick={() => {
                      setStation(s);
                      setSelectedProductId(null);
                      setStep('products');
                      onStationClick?.(s.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{s.name}</h3>
                        <p className="text-sm text-muted-foreground">{s.address}</p>
                        {s.rating != null && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span>{s.rating}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {s.distanceKm?.toFixed(1)} km
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          </TabsContent>

          <TabsContent value="vendors">
            <VendorsNearby />
          </TabsContent>
        </Tabs>
      )}


      {/* STEP 3 + 4 */}
      {step === 'products' && station && (
        <>
          <Card className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <RadioTower className={`h-4 w-4 ${realtimeStatus === 'SUBSCRIBED' ? 'text-green-600' : 'text-muted-foreground'}`} />
              <span className="font-medium">
                {realtimeStatus === 'SUBSCRIBED' ? 'Live prices & stock' : 'Connecting to live feed…'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {productsLoading ? 'Loading…' : lastEventAt ? `Updated ${new Date(lastEventAt).toLocaleTimeString()}` : 'Synced'}
            </span>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <h3 className="font-medium">{station.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {station.address} • {station.distanceKm?.toFixed(1)} km away
                </p>
              </div>
            </div>
          </Card>

          {productsError && (
            <Card className="p-3 border-destructive/40">
              <p className="text-sm text-destructive">Could not load products: {productsError}</p>
            </Card>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Station Products</h2>
            {!productsLoading && availableProducts.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">
                This station has no products available right now. Pick another station.
              </Card>
            )}
            {stationProducts.map((p) => {
              const disabled = !p.is_available;
              const u = unitForProduct(p.product_name, p.unit);
              return (
                <Card
                  key={p.id}
                  className={`p-4 border-2 transition-all ${
                    disabled
                      ? 'opacity-60 border-border cursor-not-allowed'
                      : selectedProductId === p.id
                      ? 'border-primary bg-primary/5 cursor-pointer'
                      : 'border-border hover:border-primary/50 cursor-pointer'
                  }`}
                  onClick={() => !disabled && setSelectedProductId(p.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{p.product_name}</h3>
                      <p className="text-xs text-muted-foreground">Sold per {u === 'kg' ? 'kilogram' : 'litre'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        ₦{Number(p.price ?? 0).toLocaleString()}/{u}
                      </p>
                      {disabled ? (
                        <Badge variant="secondary" className="text-destructive">Currently unavailable</Badge>
                      ) : (
                        <p className="text-xs text-green-600">
                          {p.quantity_available != null
                            ? `${Number(p.quantity_available).toLocaleString()} ${u} in stock`
                            : 'Available'}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {productUnavailable && (
            <Card className="p-3 border-destructive/40 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">
                {product?.product_name} just became unavailable at {station.name}. Please pick another product.
              </p>
            </Card>
          )}

          {product && !productUnavailable && (
            <>
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">
                  Quantity ({unit === 'kg' ? 'Kilograms' : 'Litres'})
                </h2>
                <Card className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{quantity}</div>
                      <div className="text-sm text-muted-foreground">{unit}</div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>
                      ₦{pricePerUnit.toLocaleString()} × {quantity} {unit}
                    </span>
                    <span className="font-semibold text-primary">₦{subtotal.toLocaleString()}</span>
                  </div>
                </Card>
              </div>

              <Button variant="fuel" size="xl" className="w-full" onClick={() => setStep('delivery')}>
                Continue to Delivery
              </Button>
            </>
          )}
        </>
      )}

      {/* STEP 5 + 6 */}
      {step === 'delivery' && (
        <>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Delivery Address</h2>
            <Card className="p-4 space-y-3">
              <Label htmlFor="address">Where should we deliver?</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Delivered from {station?.name}
              </p>
            </Card>
          </div>

          {/* Service level — distance-based pricing, not a flat surcharge */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Delivery Speed</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'standard' as ServiceLevel, title: 'Standard', desc: 'Local provider • normal queue', icon: <Clock className="h-4 w-4" /> },
                { id: 'fast' as ServiceLevel, title: 'Fast Track', desc: 'Priority allocation • faster pickup', icon: <Zap className="h-4 w-4" /> },
              ]).map((opt) => (
                <Card
                  key={opt.id}
                  className={`p-3 cursor-pointer border-2 transition-all ${
                    serviceLevel === opt.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setServiceLevel(opt.id)}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    {opt.icon} {opt.title}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Delivery Provider</h2>
              <p className="text-xs text-muted-foreground">
                Ranked by how close they already are to you, pickup time, workload and reliability.
              </p>
            </div>

            {reassignedFrom && (
              <Card className="p-3 border-primary/40 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-xs">
                  Your first choice became unavailable — we reassigned you to the next best provider.
                </p>
              </Card>
            )}

            {providersLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Finding providers near you…
              </p>
            )}

            {!providersLoading && rankedProviders.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">
                No {serviceLevel === 'fast' ? 'Fast Track ' : ''}partner is active in your area right now — Station
                Delivery below can still handle this order.
              </Card>
            )}

            {rankedProviders.map((p, i) => {
              const active = deliveryProvider === 'partner' && providerId === p.id;
              return (
                <Card
                  key={p.id}
                  className={`p-4 cursor-pointer border-2 transition-all ${
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => {
                    setDeliveryProvider('partner');
                    setProviderId(p.id);
                    setReassignedFrom(null);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Bike className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">
                          {p.name} {i === 0 && <Badge variant="secondary" className="ml-1">Best match</Badge>}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {p.distanceKm.toFixed(1)} km away • {p.pickupMinutes} min pickup
                          {p.serviceArea ? ` • ${p.serviceArea}` : ''}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {p.rating.toFixed(1)} • {p.activeJobs} active job{p.activeJobs === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">₦{p.fee.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{p.logisticsKm.toFixed(1)} km route</p>
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card
              className={`p-4 cursor-pointer border-2 transition-all ${
                deliveryProvider === 'in-house' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setDeliveryProvider('in-house')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">🏪 Station Delivery</h3>
                  <p className="text-xs text-muted-foreground">In-house rider • Verified station staff</p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">Available</Badge>
              </div>
            </Card>
          </div>

          <Card className="p-3 bg-muted/30">
            <p className="text-[11px] text-muted-foreground">
              Fuel is dispensed at the station into an approved container. Please confirm the container type you use
              meets Nigerian regulations for the product being delivered.
            </p>
          </Card>

          <Button
            variant="fuel"
            size="xl"
            className="w-full"
            disabled={!address.trim() || (deliveryProvider === 'partner' && !selectedProvider)}
            onClick={() => setStep('checkout')}
          >
            Continue to Checkout
          </Button>

        </>
      )}

      {/* STEP 7 */}
      {step === 'checkout' && product && station && (
        <>
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{product.product_name} ({quantity} {unit})</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Station</span>
                <span className="font-medium">{station.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery to</span>
                <span className="font-medium text-right max-w-[60%]">{address}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                  {deliveryFee === 0 ? 'Free' : `₦${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Payment Method</h2>
            <Card
              className={`p-4 cursor-pointer border-2 transition-all ${
                paymentMethod === 'wallet' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('wallet')}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">Wallet</h3>
                    <p className="text-xs text-muted-foreground">Pay from your FuelNow balance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="font-semibold text-primary">
                    {walletLoading ? '—' : `₦${balance.toLocaleString()}`}
                  </p>
                </div>
              </div>
              {paymentMethod === 'wallet' && !walletLoading && balance < total && (
                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <p className="text-xs text-destructive">
                    Insufficient balance — fund wallet (₦{(total - balance).toLocaleString()} short)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFundWallet?.();
                    }}
                  >
                    Fund Wallet
                  </Button>
                </div>
              )}
            </Card>
            <Card
              className={`p-4 cursor-pointer border-2 transition-all ${
                paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Card / Bank Transfer</h3>
                  <p className="text-xs text-muted-foreground">Secure checkout (gateway pending)</p>
                </div>
              </div>
            </Card>
          </div>

          {walletError && (
            <Card className="p-3 border-destructive/40">
              <p className="text-sm text-destructive">{walletError}</p>
            </Card>
          )}

          {paymentState === 'paid' ? (
            <Card className="p-4 border-primary/40 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Paid from wallet</p>
                <p className="text-muted-foreground text-xs">
                  ₦{total.toLocaleString()} debited. {station.name} has been notified of your order.
                </p>
              </div>
            </Card>
          ) : paymentState === 'pending' ? (
            <Card className="p-4 border-primary/40 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Order placed — payment confirmation pending</p>
                <p className="text-muted-foreground text-xs">
                  Live card/bank payments aren't enabled yet. {station.name} has been notified of your order.
                </p>
              </div>
            </Card>
          ) : (
            <Button
              variant="fuel"
              size="xl"
              className="w-full"
              disabled={
                paymentState === 'processing' ||
                (paymentMethod === 'wallet' && (walletLoading || balance < total))
              }
              onClick={handlePay}
            >
              {paymentState === 'processing' ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing…</>
              ) : (
                <><Fuel className="h-5 w-5 mr-2" /> Pay ₦{total.toLocaleString()}</>
              )}
            </Button>
          )}

        </>
      )}
    </div>
  );
};

export default OrderFuelScreen;
