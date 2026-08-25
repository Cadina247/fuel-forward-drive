import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PodcReceipt from '@/components/PodcReceipt';
import { usePurchaseOrder } from '@/contexts/PurchaseOrderContext';
import { MapPin, ShieldCheck } from 'lucide-react';

interface Props {
  /** Goes back to the live tracking screen. */
  onBack: () => void;
}

/**
 * PODC receipt screen — appears automatically (realtime) as soon as the
 * backend generates the Proof of Delivery Code for the active order.
 */
const PodcReceiptScreen: React.FC<Props> = ({ onBack }) => {
  const { order } = usePurchaseOrder();

  if (!order?.podc) {
    return (
      <div className="p-4 space-y-4">
        <Card className="p-6 text-center space-y-2">
          <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">No delivery code yet</p>
          <p className="text-sm text-muted-foreground">
            Your Proof of Delivery Code appears here as soon as your driver is on the way.
          </p>
        </Card>
        <Button variant="fuel" size="lg" className="w-full" onClick={onBack}>
          <MapPin className="h-4 w-4 mr-2" /> Back to Tracking
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">Your delivery code is ready</h1>
        <p className="text-sm text-muted-foreground">
          Your driver will ask for this code when delivering. Keep it safe.
        </p>
      </div>

      <PodcReceipt digits={order.podc} fullCode={order.podcCode} />

      <Button variant="fuel" size="xl" className="w-full" onClick={onBack}>
        <MapPin className="h-5 w-5 mr-2" /> Back to Tracking
      </Button>
    </div>
  );
};

export default PodcReceiptScreen;
