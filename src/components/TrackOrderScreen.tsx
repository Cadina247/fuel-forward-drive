import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Truck, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone,
  MessageSquare,
  CheckCircle,
  User,
  Navigation
} from 'lucide-react';

interface TrackOrderScreenProps {
  onBack: () => void;
}

const TrackOrderScreen: React.FC<TrackOrderScreenProps> = ({ onBack }) => {
  const [currentProgress, setCurrentProgress] = useState(75);

  // Mock order data
  const orderData = {
    id: 'FN-2024-001234',
    podc: '847392',
    fuelType: 'Petrol (PMS)',
    quantity: 20,
    amount: 12340,
    deliveryFee: 0,
    station: 'Shell - Victoria Island',
    address: '15 Admiralty Way, Lekki Phase 1, Lagos',
    estimatedTime: '15-20 minutes',
    driver: {
      name: 'Ahmed Ibrahim',
      phone: '+234 801 234 5678',
      photo: '/api/placeholder/64/64',
      rating: 4.9,
      vehicle: 'Toyota Hilux - ABC 123 XY'
    },
    timeline: [
      {
        status: 'Order Placed',
        time: '10:30 AM',
        completed: true,
        description: 'Your order has been confirmed'
      },
      {
        status: 'Preparing',
        time: '10:35 AM',
        completed: true,
        description: 'Fuel is being prepared for delivery'
      },
      {
        status: 'En Route',
        time: '10:45 AM',
        completed: true,
        description: 'Driver is on the way to your location'
      },
      {
        status: 'Nearby',
        time: '11:00 AM (Est.)',
        completed: false,
        description: 'Driver is approaching your location'
      },
      {
        status: 'Delivered',
        time: '11:05 AM (Est.)',
        completed: false,
        description: 'Fuel delivered and PODC verified'
      }
    ]
  };

  useEffect(() => {
    // Simulate real-time progress updates
    const interval = setInterval(() => {
      setCurrentProgress(prev => {
        if (prev < 85) return prev + 1;
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Track Order</h1>
          <p className="text-sm text-muted-foreground">Order #{orderData.id}</p>
        </div>
      </div>

      {/* Order Progress */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Order Status</h3>
            <Badge variant="default" className="bg-primary">En Route</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentProgress}%</span>
            </div>
            <Progress value={currentProgress} className="h-3" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Estimated arrival: {orderData.estimatedTime}</span>
          </div>
        </div>
      </Card>

      {/* Live Map Placeholder */}
      <Card className="p-4">
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100"></div>
          <div className="relative z-10 text-center">
            <MapPin className="h-12 w-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-medium">Live GPS Tracking</p>
            <p className="text-xs text-muted-foreground">Driver location updates in real-time</p>
          </div>
          {/* Mock route line */}
          <div className="absolute top-4 left-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <div className="absolute bottom-4 right-4 w-6 h-6 bg-red-500 rounded-full"></div>
        </div>
      </Card>

      {/* Driver Information */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Your Driver</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{orderData.driver.name}</h4>
            <p className="text-sm text-muted-foreground">{orderData.driver.vehicle}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex text-yellow-400">
                {'★'.repeat(Math.floor(orderData.driver.rating))}
              </div>
              <span className="text-sm text-muted-foreground">({orderData.driver.rating})</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </Card>

      {/* Order Details */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Order Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Fuel Type</span>
            <span className="font-medium">{orderData.fuelType}</span>
          </div>
          <div className="flex justify-between">
            <span>Quantity</span>
            <span className="font-medium">{orderData.quantity} Liters</span>
          </div>
          <div className="flex justify-between">
            <span>Station</span>
            <span className="font-medium">{orderData.station}</span>
          </div>
          <div className="flex justify-between">
            <span>PODC</span>
            <span className="font-mono font-semibold text-primary">{orderData.podc}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Address</span>
            <span className="font-medium text-right text-sm">{orderData.address}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between font-semibold">
              <span>Total Amount</span>
              <span>₦{orderData.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Order Timeline</h3>
        <div className="space-y-4">
          {orderData.timeline.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed 
                  ? 'bg-primary text-white' 
                  : index === 2 
                    ? 'bg-blue-500 text-white animate-pulse' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <div className="w-2 h-2 bg-current rounded-full"></div>
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`font-medium ${
                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.status}
                  </h4>
                  <span className={`text-sm ${
                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button variant="outline" size="lg" className="w-full">
          <Navigation className="h-5 w-5 mr-2" />
          View Full Map
        </Button>
        <Button variant="destructive" size="lg" className="w-full">
          Cancel Order
        </Button>
      </div>

      {/* PODC Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="text-center">
          <h3 className="font-semibold text-blue-800 mb-2">Your PODC</h3>
          <div className="text-3xl font-bold text-blue-900 mb-2">{orderData.podc}</div>
          <p className="text-sm text-blue-700">
            Share this code with the driver upon delivery to confirm receipt
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TrackOrderScreen;