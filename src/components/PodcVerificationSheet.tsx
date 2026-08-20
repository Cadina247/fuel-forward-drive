import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { haversineKm } from '@/hooks/useNearbyStations';
import { CheckCircle2, Loader2, MapPin, QrCode, ShieldCheck, XCircle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The order's Proof of Delivery Code (6 digits). */
  expectedCode: string;
  orderId: string;
  /** Delivery destination used for the live-location check. */
  destination: { lat: number; lng: number };
  /** Max distance (km) between the customer and the delivery address. */
  toleranceKm?: number;
  onVerified?: (info: { orderId: string; distanceKm: number | null }) => void;
}

type Check = 'idle' | 'checking' | 'ok' | 'fail';

const PodcVerificationSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  expectedCode,
  orderId,
  destination,
  toleranceKm = 1.5,
  onVerified,
}) => {
  const [code, setCode] = useState('');
  const [locationState, setLocationState] = useState<Check>('idle');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const checkLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationState('fail');
      setLocationMessage('Location is not available on this device.');
      return;
    }
    setLocationState('checking');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversineKm(
          { lat: pos.coords.latitude, lng: pos.coords.longitude },
          destination
        );
        setDistanceKm(km);
        if (km <= toleranceKm) {
          setLocationState('ok');
          setLocationMessage(`You are ${km.toFixed(2)} km from the delivery address.`);
        } else {
          setLocationState('fail');
          setLocationMessage(
            `You appear to be ${km.toFixed(1)} km away from the delivery address. Move closer to confirm.`
          );
        }
      },
      () => {
        setLocationState('fail');
        setLocationMessage('We could not read your location. Allow location access and retry.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [destination, toleranceKm]);

  useEffect(() => {
    if (open) {
      setCode('');
      setResult('idle');
      setError('');
      checkLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const stopScan = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);
  useEffect(() => {
    if (!open) stopScan();
  }, [open, stopScan]);

  const startScan = useCallback(async () => {
    setScanError('');
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setScanError('QR scanning is not supported on this browser — enter the code manually.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setScanning(true);
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        const detector = new Detector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const digits = codes?.[0]?.rawValue?.replace(/\D/g, '').slice(-6);
            if (digits && digits.length === 6) {
              setCode(digits);
              stopScan();
              return;
            }
          } catch {
            /* keep scanning */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      });
    } catch {
      setScanError('Camera permission denied — enter the code manually.');
      setScanning(false);
    }
  }, [stopScan]);

  const verify = async () => {
    setError('');
    if (code.length !== 6) {
      setError('Enter all 6 digits of the PODC.');
      return;
    }
    if (locationState === 'checking') {
      setError('Hold on — still checking your location.');
      return;
    }
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 700));
    setVerifying(false);
    if (code !== expectedCode) {
      setResult('error');
      setError('That code does not match this order. Ask the driver to read it again.');
      return;
    }
    setResult('success');
    onVerified?.({ orderId, distanceKm });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Confirm delivery
          </SheetTitle>
          <SheetDescription>
            Enter or scan the 6-digit Proof of Delivery Code. We validate it against your order and
            your live location.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {/* Location validation */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" /> Location check
              </div>
              <Badge variant={locationState === 'ok' ? 'secondary' : 'outline'}>
                {locationState === 'checking'
                  ? 'Checking…'
                  : locationState === 'ok'
                    ? 'At delivery point'
                    : locationState === 'fail'
                      ? 'Unconfirmed (optional)'
                      : 'Pending'}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {locationMessage || 'Verifying that you are at the delivery address…'}
              {locationState === 'fail' && ' You can still confirm with the correct PODC.'}
            </p>
            {locationState !== 'ok' && (
              <Button variant="outline" size="sm" className="mt-3" onClick={checkLocation}>
                Retry location check
              </Button>
            )}
          </div>

          {/* Code entry */}
          {result === 'success' ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-green-600" />
              <p className="font-semibold text-green-800">Delivery confirmed</p>
              <p className="text-xs text-green-700">
                PODC verified for order {orderId}
                {distanceKm !== null ? ` • ${distanceKm.toFixed(2)} km from address` : ''}
              </p>
              <Button className="mt-4 w-full" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-sm font-medium">Delivery code</p>
                <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric">
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-2">
                {scanning ? (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      muted
                      playsInline
                      className="aspect-video w-full rounded-lg bg-black object-cover"
                    />
                    <Button variant="outline" className="w-full" onClick={stopScan}>
                      Stop scanning
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" onClick={startScan}>
                    <QrCode className="mr-2 h-4 w-4" /> Scan driver QR code
                  </Button>
                )}
                {scanError && <p className="text-xs text-muted-foreground">{scanError}</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={verifying || code.length !== 6 || locationState === 'checking'}
                onClick={verify}
              >
                {verifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                  </>
                ) : (
                  'Confirm delivery'
                )}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PodcVerificationSheet;
