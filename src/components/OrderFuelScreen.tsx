import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Fuel, 
  MapPin, 
  Clock, 
  Star, 
  CreditCard,
  ArrowLeft,
  Plus,
  Minus
} from 'lucide-react';

interface OrderFuelScreenProps {
  onBack: () => void;
  onPlaceOrder: (orderData: any) => void;
  onStationClick?: (stationId: string) => void;
}

const OrderFuelScreen: React.FC<OrderFuelScreenProps> = ({ onBack, onPlaceOrder, onStationClick }) => {
  const [selectedFuel, setSelectedFuel] = useState('petrol');
  const [quantity, setQuantity] = useState(20);
  const [selectedStation, setSelectedStation] = useState('shell-vi');

  const fuelTypes = [
    { id: 'petrol', name: 'Petrol (PMS)', price: 617, icon: '⛽' },
    { id: 'diesel', name: 'Diesel (AGO)', price: 750, icon: '🚛' },
    { id: 'kerosene', name: 'Kerosene (DPK)', price: 650, icon: '🪔' },
    { id: 'gas', name: 'Cooking Gas', price: 850, icon: '🔥', unit: 'kg' }
  ];

  const stations = [
    {
      id: 'shell-vi',
      name: 'Shell - Victoria Island',
      rating: 4.8,
      deliveryTime: '15-25 min',
      distance: '2.3 km',
      priceModifier: 0
    },
    {
      id: 'total-lekki',
      name: 'Total - Lekki Phase 1',
      rating: 4.6,
      deliveryTime: '20-30 min',
      distance: '3.1 km',
      priceModifier: 10
    },
    {
      id: 'mobil-ikeja',
      name: 'Mobil - Ikeja',
      rating: 4.5,
      deliveryTime: '25-35 min',
      distance: '4.2 km',
      priceModifier: -5
    }
  ];

  const selectedFuelData = fuelTypes.find(f => f.id === selectedFuel);
  const selectedStationData = stations.find(s => s.id === selectedStation);
  const basePrice = selectedFuelData?.price || 0;
  const finalPrice = basePrice + (selectedStationData?.priceModifier || 0);
  const totalAmount = finalPrice * quantity;
  const deliveryFee = totalAmount > 20000 ? 0 : 500;

  const handlePlaceOrder = () => {
    const orderData = {
      fuelType: selectedFuelData,
      station: selectedStationData,
      quantity,
      totalAmount: totalAmount + deliveryFee,
      deliveryFee,
      timestamp: new Date().toISOString()
    };
    onPlaceOrder(orderData);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Order Fuel</h1>
      </div>

      {/* Fuel Type Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Select Fuel Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {fuelTypes.map((fuel) => (
            <Card 
              key={fuel.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedFuel === fuel.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedFuel(fuel.id)}
            >
              <div className="text-center space-y-2">
                <div className="text-2xl">{fuel.icon}</div>
                <h3 className="font-medium text-sm">{fuel.name}</h3>
                <p className="text-primary font-semibold">₦{fuel.price}/{fuel.unit || 'L'}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Station Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Choose Station</h2>
        <div className="space-y-3">
          {stations.map((station) => (
            <Card 
              key={station.id}
              className={`p-4 cursor-pointer transition-all border-2 ${
                selectedStation === station.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => {
                setSelectedStation(station.id);
                if (onStationClick) onStationClick(station.id);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{station.name}</h3>
                    {station.priceModifier < 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Cheaper
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span>{station.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{station.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{station.distance}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">₦{finalPrice}/L</p>
                  {station.priceModifier !== 0 && (
                    <p className="text-xs text-muted-foreground">
                      {station.priceModifier > 0 ? '+' : ''}₦{station.priceModifier}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quantity Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Quantity ({selectedFuelData?.unit || 'Liters'})</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold">{quantity}</div>
              <div className="text-sm text-muted-foreground">{selectedFuelData?.unit || 'Liters'}</div>
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Delivery Address */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Delivery Address</h2>
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">Current Location</span>
            </div>
            <p className="text-sm text-muted-foreground">
              15 Admiralty Way, Lekki Phase 1, Lagos
            </p>
            <Button variant="outline" size="sm">
              Change Address
            </Button>
          </div>
        </Card>
      </div>

      {/* Order Summary */}
      <Card className="p-4 bg-muted/30">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{selectedFuelData?.name} ({quantity} {selectedFuelData?.unit || 'L'})</span>
            <span>₦{totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className={deliveryFee === 0 ? 'text-green-600 line-through' : ''}>
              ₦{deliveryFee.toLocaleString()}
            </span>
          </div>
          {deliveryFee === 0 && (
            <div className="flex justify-between text-green-600">
              <span>Free Delivery</span>
              <span>₦0</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>₦{(totalAmount + deliveryFee).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Payment Method */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-medium">Payment Method</h3>
              <p className="text-sm text-muted-foreground">Visa ****1234</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Change</Button>
        </div>
      </Card>

      {/* Place Order Button */}
      <Button 
        variant="fuel" 
        size="xl" 
        className="w-full"
        onClick={handlePlaceOrder}
      >
        <Fuel className="h-5 w-5 mr-2" />
        Place Order - ₦{(totalAmount + deliveryFee).toLocaleString()}
      </Button>
    </div>
  );
};

export default OrderFuelScreen;