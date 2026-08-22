import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Copy, Expand, ShieldCheck } from 'lucide-react';

interface Props {
  /** 6-digit delivery code. */
  digits: string;
  /** Full PODC string, e.g. PODC-2026082114-K7J2M9Q5. */
  fullCode?: string;
}

const PodcReceipt: React.FC<Props> = ({ digits, fullCode }) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const qrValue = fullCode || digits;

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: `${label} copied to clipboard.` });
    } catch {
      toast({ title: 'Copy failed', description: 'Long-press the code to copy it manually.' });
    }
  };

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-blue-800">
          <ShieldCheck className="h-5 w-5" />
          <h3 className="font-semibold">Proof of Delivery Code (PODC)</h3>
        </div>
        <p className="text-sm text-blue-700">Your delivery code is ready</p>

        <div className="text-4xl font-bold tracking-[0.3em] text-blue-900">{digits}</div>
        {fullCode && <p className="text-xs font-mono text-blue-700">{fullCode}</p>}
        <p className="text-xs text-blue-700">
          Save this code — your driver will ask for it when they deliver.
        </p>

        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mx-auto block bg-white p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          aria-label="Expand QR code"
        >
          <QRCodeSVG value={qrValue} size={120} />
          <span className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mt-2">
            <Expand className="h-3 w-3" /> Tap to expand
          </span>
        </button>

        <Button variant="outline" className="w-full" onClick={() => copy(fullCode || digits, 'PODC code')}>
          <Copy className="h-4 w-4 mr-2" /> Copy Code
        </Button>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-xs text-center">
          <div className="bg-white p-4 rounded-xl inline-block mx-auto">
            <QRCodeSVG value={qrValue} size={240} />
          </div>
          <p className="text-2xl font-bold tracking-[0.25em]">{digits}</p>
          {fullCode && <p className="text-xs font-mono text-muted-foreground">{fullCode}</p>}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PodcReceipt;
