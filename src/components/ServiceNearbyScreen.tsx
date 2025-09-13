import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Fuel,
  Wrench,
  Circle,
  Car,
  Search,
  Navigation,
  Phone,
  MessageCircle,
  CheckCircle,
  CreditCard,
  Wallet,
  History,
  Heart,
  User
} from 'lucide-react';

interface ServiceNearbyScreenProps {
  onBack: () => void;
}

type ServiceType = 'gas' | 'mechanic' | 'tire' | 'carwash';
type RequestStatus = 'selecting' | 'details' | 'location' | 'payment' | 'searching' | 'assigned' | 'inprogress' | 'completed';

interface Provider {
  id: string;
  name: string;
  business: string;
  rating: number;
  distance: number;
  vehicleType: string;
  eta: number;
  avatar: string;
  phone: string;
}

interface ServiceRequest {
  id?: string;
  type: ServiceType;
  details: any;
  location: string;
  price: number;
  provider?: Provider;
  status: RequestStatus;
  timeline: { step: string; completed: boolean; time?: string }[];
}

const ServiceNearbyScreen: React.FC<ServiceNearbyScreenProps> = ({ onBack }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('request');
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest>({
    type: 'gas',
    details: {},
    location: '',
    price: 0,
    status: 'selecting',
    timeline: []
  });
  const [searchingProgress, setSearchingProgress] = useState(0);

  const services = [
    { id: 'gas', name: 'Gas Refill/Delivery', icon: Fuel, color: 'bg-blue-500' },
    { id: 'mechanic', name: 'Mechanic Service', icon: Wrench, color: 'bg-orange-500' },
    { id: 'tire', name: 'Tire Service', icon: Circle, color: 'bg-green-500' },
    { id: 'carwash', name: 'Car Wash', icon: Car, color: 'bg-purple-500' }
  ];

  const mockProviders: Provider[] = [
    {
      id: '1',
      name: 'John Doe',
      business: 'QuickGas Services',
      rating: 4.8,
      distance: 0.5,
      vehicleType: 'Tricycle',
      eta: 8,
      avatar: 'JD',
      phone: '+234-801-2345-678'
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      business: 'MechPro Auto',
      rating: 4.9,
      distance: 1.2,
      vehicleType: 'Van',
      eta: 12,
      avatar: 'SW',
      phone: '+234-802-3456-789'
    }
  ];

  const orderHistory = [
    {
      id: 'ORD001',
      type: 'gas',
      provider: 'QuickGas Services',
      date: '2024-01-15',
      amount: '₦2,500',
      status: 'completed',
      rating: 5
    },
    {
      id: 'ORD002',
      type: 'mechanic',
      provider: 'MechPro Auto',
      date: '2024-01-10',
      amount: '₦8,000',
      status: 'completed',
      rating: 4
    }
  ];

  useEffect(() => {
    if (currentRequest.status === 'searching') {
      const interval = setInterval(() => {
        setSearchingProgress(prev => {
          if (prev >= 100) {
            setCurrentRequest(prev => ({
              ...prev,
              status: 'assigned',
              provider: mockProviders[0],
              timeline: [
                { step: 'Request Placed', completed: true, time: '10:30 AM' },
                { step: 'Provider Assigned', completed: true, time: '10:32 AM' },
                { step: 'On the Way', completed: false },
                { step: 'Service in Progress', completed: false },
                { step: 'Completed', completed: false }
              ]
            }));
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [currentRequest.status]);

  const handleServiceSelect = (serviceType: ServiceType) => {
    setCurrentRequest(prev => ({
      ...prev,
      type: serviceType,
      status: 'details'
    }));
  };

  const handleDetailsSubmit = () => {
    setCurrentRequest(prev => ({
      ...prev,
      status: 'location'
    }));
  };

  const handleLocationSubmit = () => {
    const basePrice = currentRequest.type === 'gas' ? 2500 : 
                     currentRequest.type === 'mechanic' ? 8000 :
                     currentRequest.type === 'tire' ? 5000 : 3000;
    
    setCurrentRequest(prev => ({
      ...prev,
      status: 'payment',
      price: basePrice
    }));
  };

  const handlePayment = () => {
    setCurrentRequest(prev => ({
      ...prev,
      status: 'searching',
      id: 'REQ' + Math.random().toString().substr(2, 6)
    }));
    setSearchingProgress(0);
    toast({
      title: "Payment Successful",
      description: "Searching for nearby providers...",
    });
  };

  const renderServiceSelection = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Select Service</h2>
      <div className="grid grid-cols-2 gap-4">
        {services.map((service) => {
          const IconComponent = service.icon;
          return (
            <Card 
              key={service.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleServiceSelect(service.id as ServiceType)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 ${service.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <p className="font-medium text-sm">{service.name}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderDetailsForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setCurrentRequest(prev => ({ ...prev, status: 'selecting' }))}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <h2 className="text-xl font-bold">Service Details</h2>
      
      {currentRequest.type === 'gas' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cylinder-size">Cylinder Size</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select cylinder size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6kg">6kg Cylinder</SelectItem>
                <SelectItem value="12.5kg">12.5kg Cylinder</SelectItem>
                <SelectItem value="25kg">25kg Cylinder</SelectItem>
                <SelectItem value="50kg">50kg Cylinder</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {currentRequest.type === 'mechanic' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="issue-type">Issue Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engine">Engine Problem</SelectItem>
                <SelectItem value="battery">Battery Issue</SelectItem>
                <SelectItem value="brake">Brake Service</SelectItem>
                <SelectItem value="general">General Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {currentRequest.type === 'tire' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="tire-service">Tire Service</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select tire service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flat-fix">Flat Tire Fix</SelectItem>
                <SelectItem value="replacement">Tire Replacement</SelectItem>
                <SelectItem value="balancing">Wheel Balancing</SelectItem>
                <SelectItem value="alignment">Wheel Alignment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {currentRequest.type === 'carwash' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="wash-package">Wash Package</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select wash package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic Wash</SelectItem>
                <SelectItem value="premium">Premium Wash</SelectItem>
                <SelectItem value="deluxe">Deluxe Wash & Wax</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      <Button onClick={handleDetailsSubmit} className="w-full">
        Continue
      </Button>
    </div>
  );

  const renderLocationForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setCurrentRequest(prev => ({ ...prev, status: 'details' }))}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <h2 className="text-xl font-bold">Service Location</h2>
      
      <div className="space-y-4">
        <Button variant="outline" className="w-full justify-start">
          <Navigation className="h-4 w-4 mr-2" />
          Use Current Location
        </Button>
        
        <div>
          <Label htmlFor="manual-address">Or Enter Address Manually</Label>
          <Input 
            id="manual-address"
            placeholder="Enter your address"
            value={currentRequest.location}
            onChange={(e) => setCurrentRequest(prev => ({ ...prev, location: e.target.value }))}
          />
        </div>
        
        <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Map View</p>
        </div>
      </div>
      
      <Button onClick={handleLocationSubmit} className="w-full">
        Continue to Payment
      </Button>
    </div>
  );

  const renderPaymentForm = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setCurrentRequest(prev => ({ ...prev, status: 'location' }))}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <h2 className="text-xl font-bold">Payment</h2>
      
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span>₦{currentRequest.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₦500</span>
            </div>
            <hr />
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>₦{(currentRequest.price + 500).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <Wallet className="h-4 w-4 mr-2" />
          Wallet Balance: ₦25,000
        </Button>
        <Button variant="outline" className="w-full justify-start">
          <CreditCard className="h-4 w-4 mr-2" />
          Card Payment
        </Button>
      </div>
      
      <Button onClick={handlePayment} className="w-full">
        Pay ₦{(currentRequest.price + 500).toLocaleString()}
      </Button>
    </div>
  );

  const renderSearching = () => (
    <div className="space-y-4 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <Search className="h-8 w-8 text-blue-600 animate-pulse" />
      </div>
      <h2 className="text-xl font-bold">Searching for nearby providers...</h2>
      <Progress value={searchingProgress} className="w-full" />
      <p className="text-gray-600">We're finding the best provider for you</p>
    </div>
  );

  const renderAssigned = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Provider Assigned</h2>
      
      {currentRequest.provider && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">{currentRequest.provider.avatar}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{currentRequest.provider.name}</h3>
                <p className="text-sm text-gray-600">{currentRequest.provider.business}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm">{currentRequest.provider.rating}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm">{currentRequest.provider.eta} min</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="bg-gray-100 h-40 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Live Tracking Map</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentRequest.timeline.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {step.completed && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${step.completed ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.step}
                  </p>
                  {step.time && <p className="text-sm text-gray-500">{step.time}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Order History</h2>
      <div className="space-y-3">
        {orderHistory.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{order.id}</h3>
                  <p className="text-sm text-gray-600 capitalize">{order.type} Service</p>
                  <p className="text-sm text-gray-600">{order.provider}</p>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.amount}</p>
                  <Badge variant="secondary" className="text-xs">
                    {order.status}
                  </Badge>
                  <div className="flex items-center mt-1">
                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                    <span className="text-xs">{order.rating}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderWallet = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Wallet</h2>
      
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-2xl font-bold">₦25,000</h3>
          <p className="text-gray-600">Available Balance</p>
          <div className="flex space-x-2 mt-4">
            <Button className="flex-1">Add Funds</Button>
            <Button variant="outline" className="flex-1">Withdraw</Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        <h3 className="font-bold">Recent Transactions</h3>
        {orderHistory.map((transaction) => (
          <div key={transaction.id} className="flex justify-between items-center py-2 border-b">
            <div>
              <p className="font-medium">{transaction.provider}</p>
              <p className="text-sm text-gray-600">{transaction.date}</p>
            </div>
            <p className="font-bold text-red-600">-{transaction.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    if (activeTab === 'request') {
      switch (currentRequest.status) {
        case 'selecting':
          return renderServiceSelection();
        case 'details':
          return renderDetailsForm();
        case 'location':
          return renderLocationForm();
        case 'payment':
          return renderPaymentForm();
        case 'searching':
          return renderSearching();
        case 'assigned':
        case 'inprogress':
          return renderAssigned();
        default:
          return renderServiceSelection();
      }
    } else if (activeTab === 'history') {
      return renderOrderHistory();
    } else if (activeTab === 'wallet') {
      return renderWallet();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Nearby Resources</h1>
          <div className="w-10" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="space-y-4">
            {renderCurrentScreen()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ServiceNearbyScreen;