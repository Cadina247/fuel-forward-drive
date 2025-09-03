import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Flame, Star, MapPin, Clock, CreditCard, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CookingGasScreenProps {
  onBack: () => void;
}

interface GasPartner {
  id: string;
  name: string;
  trustScore: number;
  distance: string;
  eta: string;
  cylinders: Array<{
    size: string;
    available: number;
    leaseFee: number;
    refillFee: number;
  }>;
  rating: number;
  reviews: number;
}

const CookingGasScreen: React.FC<CookingGasScreenProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState<'service' | 'partners' | 'order' | 'confirmation'>('service');
  const [selectedService, setSelectedService] = useState<'refill' | 'exchange'>('refill');
  const [selectedPartner, setSelectedPartner] = useState<GasPartner | null>(null);
  const [selectedCylinder, setSelectedCylinder] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const { toast } = useToast();

  const gasPartners: GasPartner[] = [
    {
      id: '1',
      name: 'GasHub Lagos',
      trustScore: 4.8,
      distance: '1.2 km',
      eta: '15-20 mins',
      cylinders: [
        { size: '3kg', available: 5, leaseFee: 500, refillFee: 2500 },
        { size: '6kg', available: 8, leaseFee: 800, refillFee: 4800 },
        { size: '12.5kg', available: 12, leaseFee: 1200, refillFee: 9500 }
      ],
      rating: 4.8,
      reviews: 156
    },
    {
      id: '2',
      name: 'QuickGas Express',
      trustScore: 4.6,
      distance: '2.1 km',
      eta: '20-25 mins',
      cylinders: [
        { size: '6kg', available: 3, leaseFee: 750, refillFee: 4700 },
        { size: '12.5kg', available: 6, leaseFee: 1100, refillFee: 9200 },
        { size: '50kg', available: 2, leaseFee: 3000, refillFee: 35000 }
      ],
      rating: 4.6,
      reviews: 89
    },
    {
      id: '3',
      name: 'Island Gas Circle',
      trustScore: 4.9,
      distance: '0.8 km',
      eta: '10-15 mins',
      cylinders: [
        { size: '3kg', available: 2, leaseFee: 600, refillFee: 2600 },
        { size: '6kg', available: 4, leaseFee: 900, refillFee: 4900 },
        { size: '12.5kg', available: 7, leaseFee: 1300, refillFee: 9800 }
      ],
      rating: 4.9,
      reviews: 203
    }
  ];

  const handleServiceSelection = (service: 'refill' | 'exchange') => {
    setSelectedService(service);
    if (service === 'refill') {
      setCurrentStep('order');
    } else {
      setCurrentStep('partners');
    }
  };

  const handlePartnerSelection = (partner: GasPartner) => {
    setSelectedPartner(partner);
    setCurrentStep('order');
  };

  const handlePlaceOrder = () => {
    const podc = Math.floor(100000 + Math.random() * 900000).toString();
    
    toast({
      title: 'Order Placed Successfully! 🎉',
      description: `Your PODC is ${podc}. Gas delivery in ${selectedPartner?.eta || '15-25 minutes'}`,
      duration: 5000,
    });

    setCurrentStep('confirmation');
  };

  const renderServiceSelection = () => (
    <div className="p-4 space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Flame className="h-8 w-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Cooking Gas Service</h2>
        <p className="text-muted-foreground">Choose your preferred gas service option</p>
      </div>

      <div className="space-y-4">
        <Card 
          className={`p-6 cursor-pointer border-2 transition-all ${
            selectedService === 'refill' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedService('refill')}
        >
          <div className="flex items-start gap-4">
            <RadioGroup value={selectedService}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="refill" id="refill" />
              </div>
            </RadioGroup>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Refill My Own Cylinder</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pay only for gas refill. Driver collects your empty cylinder and returns it filled.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Your Cylinder</Badge>
                <Badge variant="outline">Refill Only</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card 
          className={`p-6 cursor-pointer border-2 transition-all ${
            selectedService === 'exchange' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedService('exchange')}
        >
          <div className="flex items-start gap-4">
            <RadioGroup value={selectedService}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="exchange" id="exchange" />
              </div>
            </RadioGroup>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Lease / Exchange Cylinder</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get a pre-filled cylinder from nearby Gas Circle partners. Exchange your empty cylinder.
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Gas Circle</Badge>
                <Badge variant="outline">Instant Exchange</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Button 
        onClick={() => handleServiceSelection(selectedService)} 
        className="w-full"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );

  const renderPartnerSelection = () => (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Gas Circle Partners</h2>
        <p className="text-muted-foreground">Choose from verified partners near you</p>
      </div>

      <div className="space-y-4">
        {gasPartners.map((partner) => (
          <Card key={partner.id} className="p-4 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => handlePartnerSelection(partner)}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-lg">{partner.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{partner.rating}</span>
                    <span className="text-sm text-muted-foreground">({partner.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Trust Score: {partner.trustScore}⭐
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{partner.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">ETA: {partner.eta}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Cylinders:</h4>
              <div className="flex gap-2 flex-wrap">
                {partner.cylinders.map((cylinder, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cylinder.size} ({cylinder.available} available) - ₦{cylinder.leaseFee + cylinder.refillFee}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderOrderReview = () => {
    const cylinder = selectedPartner?.cylinders.find(c => c.size === selectedCylinder) || 
                    selectedPartner?.cylinders[0];
    
    return (
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Order Review</h2>
          <p className="text-muted-foreground">Review your gas order details</p>
        </div>

        {selectedService === 'exchange' && selectedPartner && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Flame className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedPartner.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPartner.distance} • ETA: {selectedPartner.eta}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="cylinder-size" className="text-sm font-medium">Cylinder Size</Label>
                <RadioGroup 
                  value={selectedCylinder} 
                  onValueChange={setSelectedCylinder}
                  className="mt-2"
                >
                  {selectedPartner.cylinders.map((cylinder) => (
                    <div key={cylinder.size} className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value={cylinder.size} id={cylinder.size} />
                      <Label htmlFor={cylinder.size} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{cylinder.size} Gas Cylinder</span>
                          <div className="text-right">
                            <div className="font-semibold">₦{cylinder.leaseFee + cylinder.refillFee}</div>
                            <div className="text-xs text-muted-foreground">
                              Refill: ₦{cylinder.refillFee} + Lease: ₦{cylinder.leaseFee}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </Card>
        )}

        {selectedService === 'refill' && (
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="cylinder-info">Cylinder Information</Label>
                <Input 
                  id="cylinder-info"
                  placeholder="e.g., 12.5kg Cylinder - Own Cylinder"
                  value="12.5kg - Refill Only"
                  className="mt-1"
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Refill Fee (12.5kg)</span>
                  <span className="font-semibold">₦9,500</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="delivery-address">Delivery Address</Label>
            <Input 
              id="delivery-address"
              placeholder="Enter your delivery address"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="mt-1"
            />
          </div>

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Payment Summary</h3>
            <div className="space-y-2">
              {selectedService === 'exchange' && cylinder && (
                <>
                  <div className="flex justify-between">
                    <span>Refill Fee ({cylinder.size})</span>
                    <span>₦{cylinder.refillFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cylinder Lease Fee</span>
                    <span>₦{cylinder.leaseFee}</span>
                  </div>
                </>
              )}
              {selectedService === 'refill' && (
                <div className="flex justify-between">
                  <span>Refill Fee (12.5kg)</span>
                  <span>₦9,500</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>
                    ₦{selectedService === 'exchange' && cylinder 
                      ? cylinder.refillFee + cylinder.leaseFee 
                      : 9500}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-2">
            <Button 
              onClick={handlePlaceOrder} 
              className="w-full" 
              size="lg"
              disabled={!deliveryAddress.trim()}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Place Order
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Payment will be collected upon delivery
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmation = () => (
    <div className="p-4 space-y-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Truck className="h-10 w-10 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Order Confirmed!</h2>
        <p className="text-muted-foreground">Your cooking gas is on the way</p>
      </div>

      <Card className="p-4 text-left">
        <h3 className="font-semibold mb-3">Order Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Service Type:</span>
            <span className="capitalize">{selectedService === 'exchange' ? 'Cylinder Exchange' : 'Cylinder Refill'}</span>
          </div>
          {selectedPartner && (
            <div className="flex justify-between">
              <span>Partner:</span>
              <span>{selectedPartner.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Estimated Delivery:</span>
            <span>{selectedPartner?.eta || '15-25 minutes'}</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <Button onClick={() => setCurrentStep('service')} variant="outline" className="w-full">
          Place Another Order
        </Button>
        <Button onClick={onBack} className="w-full">
          Back to Home
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Cooking Gas Delivery</h1>
            <p className="text-sm text-muted-foreground">Decentralized Gas Circle Network</p>
          </div>
        </div>
      </div>

      {currentStep === 'service' && renderServiceSelection()}
      {currentStep === 'partners' && renderPartnerSelection()}
      {currentStep === 'order' && renderOrderReview()}
      {currentStep === 'confirmation' && renderConfirmation()}
    </div>
  );
};

export default CookingGasScreen;