import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  QrCode, 
  ArrowLeft, 
  Download, 
  Share2, 
  Copy,
  Wallet,
  Clock,
  CheckCircle
} from 'lucide-react';

interface TokenGeneratorScreenProps {
  onBack: () => void;
}

const TokenGeneratorScreen: React.FC<TokenGeneratorScreenProps> = ({ onBack }) => {
  const [amount, setAmount] = useState('');
  const [generatedToken, setGeneratedToken] = useState<{
    id: string;
    qrCode: string;
    amount: number;
    timestamp: string;
  } | null>(null);

  const generateToken = () => {
    const tokenId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const token = {
      id: tokenId,
      qrCode: `FUEL-TOKEN-${tokenId}-${amount}`,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString()
    };
    setGeneratedToken(token);
  };

  const copyTokenId = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.id);
    }
  };

  const shareToken = () => {
    if (generatedToken) {
      const text = `FuelNow Token: ${generatedToken.id}\nAmount: ₦${generatedToken.amount.toLocaleString()}\nUse this token at any participating fuel station.`;
      navigator.share?.({ text }) || navigator.clipboard.writeText(text);
    }
  };

  if (generatedToken) {
    return (
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Fuel Token Generated</h1>
        </div>

        {/* Success Message */}
        <Card className="p-6 text-center bg-green-50 border-green-200">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-green-800 mb-2">Token Ready!</h2>
          <p className="text-green-700">Your fuel token has been generated successfully</p>
        </Card>

        {/* QR Code Display */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">QR Code</p>
                <p className="text-xs text-gray-400 mt-1">{generatedToken.qrCode}</p>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Token ID</h3>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-muted px-3 py-2 rounded font-mono text-lg">
                  {generatedToken.id}
                </code>
                <Button variant="outline" size="icon" onClick={copyTokenId}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Token Details */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Token Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-primary">₦{generatedToken.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Generated</span>
              <span>{new Date(generatedToken.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Until</span>
              <span>30 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
          </div>
        </Card>

        {/* How to Use */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">How to Use This Token</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Visit any participating fuel station</li>
            <li>2. Show this QR code or provide Token ID</li>
            <li>3. Station attendant will scan/enter the token</li>
            <li>4. Receive fuel worth ₦{generatedToken.amount.toLocaleString()}</li>
          </ol>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button variant="fuel" size="lg" className="w-full" onClick={shareToken}>
            <Share2 className="h-5 w-5 mr-2" />
            Share Token
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Save to Device
            </Button>
            <Button variant="outline" className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Add to Wallet
            </Button>
          </div>
        </div>

        {/* Generate Another */}
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => {
            setGeneratedToken(null);
            setAmount('');
          }}
        >
          Generate Another Token
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Generate Fuel Token</h1>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <QrCode className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">What are Fuel Tokens?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Pre-paid fuel vouchers that can be used at any participating station. 
              Perfect for gifts or budgeting your fuel expenses.
            </p>
          </div>
        </div>
      </Card>

      {/* Amount Input */}
      <div className="space-y-3">
        <Label htmlFor="amount">Enter Fuel Amount (₦)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₦</span>
          <Input
            id="amount"
            type="number"
            placeholder="5,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-8 text-lg h-14"
          />
        </div>
        <div className="flex gap-2">
          {[1000, 2000, 5000, 10000].map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => setAmount(preset.toString())}
              className="flex-1"
            >
              ₦{preset.toLocaleString()}
            </Button>
          ))}
        </div>
      </div>

      {/* Recent Tokens */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Tokens</h2>
        <div className="space-y-2">
          {[
            { id: 'ABC123DEF', amount: 5000, status: 'Used', date: '2024-01-15' },
            { id: 'XYZ789GHI', amount: 10000, status: 'Active', date: '2024-01-14' },
            { id: 'QWE456RTY', amount: 2000, status: 'Expired', date: '2024-01-10' }
          ].map((token) => (
            <Card key={token.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{token.id}</p>
                    <p className="text-sm text-muted-foreground">₦{token.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    token.status === 'Active' ? 'bg-green-100 text-green-800' :
                    token.status === 'Used' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {token.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{token.date}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button 
        variant="token" 
        size="xl" 
        className="w-full" 
        onClick={generateToken}
        disabled={!amount || parseFloat(amount) < 500}
      >
        <QrCode className="h-5 w-5 mr-2" />
        Generate Token
      </Button>

      {amount && parseFloat(amount) < 500 && (
        <p className="text-sm text-destructive text-center">
          Minimum token amount is ₦500
        </p>
      )}
    </div>
  );
};

export default TokenGeneratorScreen;