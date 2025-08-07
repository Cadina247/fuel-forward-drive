import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Phone,
  Navigation,
  Fuel,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface StationDetailsScreenProps {
  onBack: () => void;
  stationId?: string;
  onNavigate?: (screen: string) => void;
}

const StationDetailsScreen: React.FC<StationDetailsScreenProps> = ({ onBack, stationId = 'shell-vi', onNavigate }) => {
  const stations = {
    'shell-vi': {
      name: 'Shell - Victoria Island',
      address: '23 Ahmadu Bello Way, Victoria Island, Lagos',
      rating: 4.8,
      reviewCount: 342,
      distance: '2.3 km',
      phone: '+234 901 234 5678',
      openHours: '24/7',
      coordinates: { lat: 6.4281, lng: 3.4219 }
    },
    'total-lekki': {
      name: 'Total - Lekki Phase 1',
      address: '15 Admiralty Way, Lekki Phase 1, Lagos',
      rating: 4.6,
      reviewCount: 289,
      distance: '3.1 km',
      phone: '+234 901 234 5679',
      openHours: '6:00 AM - 10:00 PM',
      coordinates: { lat: 6.4317, lng: 3.4256 }
    },
    'mobil-ikeja': {
      name: 'Mobil - Ikeja',
      address: '45 Obafemi Awolowo Way, Ikeja, Lagos',
      rating: 4.5,
      reviewCount: 156,
      distance: '4.2 km',
      phone: '+234 901 234 5680',
      openHours: '5:00 AM - 11:00 PM',
      coordinates: { lat: 6.6018, lng: 3.3515 }
    }
  };

  const fuelAvailability = {
    'shell-vi': {
      petrol: { available: true, price: 617, stock: 'High', lastUpdated: '2 min ago' },
      diesel: { available: true, price: 750, stock: 'Medium', lastUpdated: '5 min ago' },
      kerosene: { available: false, price: 650, stock: 'Out of Stock', lastUpdated: '1 hour ago' },
      gas: { available: true, price: 850, stock: 'High', lastUpdated: '10 min ago' }
    },
    'total-lekki': {
      petrol: { available: true, price: 627, stock: 'Medium', lastUpdated: '1 min ago' },
      diesel: { available: true, price: 760, stock: 'High', lastUpdated: '3 min ago' },
      kerosene: { available: true, price: 650, stock: 'Low', lastUpdated: '15 min ago' },
      gas: { available: false, price: 850, stock: 'Out of Stock', lastUpdated: '2 hours ago' }
    },
    'mobil-ikeja': {
      petrol: { available: true, price: 612, stock: 'High', lastUpdated: '4 min ago' },
      diesel: { available: true, price: 745, stock: 'Medium', lastUpdated: '7 min ago' },
      kerosene: { available: true, price: 645, stock: 'High', lastUpdated: '12 min ago' },
      gas: { available: true, price: 845, stock: 'Medium', lastUpdated: '8 min ago' }
    }
  };

  const stationServices = {
    'shell-vi': [
      { name: 'Car Wash', icon: '🚗', available: true, hours: '7:00 AM - 8:00 PM' },
      { name: 'Supermarket', icon: '🏪', available: true, hours: '24/7' },
      { name: 'ATM', icon: '🏧', available: true, hours: '24/7' },
      { name: 'Restaurant', icon: '🍽️', available: true, hours: '6:00 AM - 10:00 PM' },
      { name: 'Road Signs Guide', icon: '🚦', available: true, hours: 'Real-time' },
      { name: 'Toilet Facilities', icon: '🚻', available: true, hours: '24/7' }
    ],
    'total-lekki': [
      { name: 'Car Wash', icon: '🚗', available: true, hours: '8:00 AM - 6:00 PM' },
      { name: 'Mini Mart', icon: '🏪', available: true, hours: '6:00 AM - 10:00 PM' },
      { name: 'ATM', icon: '🏧', available: false, hours: 'Out of Service' },
      { name: 'Tire Service', icon: '🛞', available: true, hours: '8:00 AM - 6:00 PM' },
      { name: 'Road Signs Guide', icon: '🚦', available: true, hours: 'Real-time' },
      { name: 'Toilet Facilities', icon: '🚻', available: true, hours: '6:00 AM - 10:00 PM' }
    ],
    'mobil-ikeja': [
      { name: 'Car Wash', icon: '🚗', available: true, hours: '7:00 AM - 7:00 PM' },
      { name: 'Salon/Barber', icon: '💇', available: true, hours: '9:00 AM - 6:00 PM' },
      { name: 'Supermarket', icon: '🏪', available: true, hours: '6:00 AM - 11:00 PM' },
      { name: 'ATM', icon: '🏧', available: true, hours: '24/7' },
      { name: 'Auto Repair', icon: '🔧', available: true, hours: '8:00 AM - 6:00 PM' },
      { name: 'Road Signs Guide', icon: '🚦', available: true, hours: 'Real-time' },
      { name: 'Toilet Facilities', icon: '🚻', available: true, hours: '6:00 AM - 11:00 PM' }
    ]
  };

  const fuelTypes = [
    { id: 'petrol', name: 'Petrol (PMS)', icon: '⛽', unit: 'L' },
    { id: 'diesel', name: 'Diesel (AGO)', icon: '🚛', unit: 'L' },
    { id: 'kerosene', name: 'Kerosene (DPK)', icon: '🪔', unit: 'L' },
    { id: 'gas', name: 'Cooking Gas', icon: '🔥', unit: 'kg' }
  ];

  const station = stations[stationId as keyof typeof stations];
  const availability = fuelAvailability[stationId as keyof typeof fuelAvailability];
  const services = stationServices[stationId as keyof typeof stationServices];

  const getStockColor = (stock: string) => {
    switch (stock) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-orange-600';
      case 'Out of Stock': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStockIcon = (available: boolean, stock: string) => {
    if (!available) return <XCircle className="h-5 w-5 text-red-500" />;
    if (stock === 'Low') return <AlertCircle className="h-5 w-5 text-orange-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Station Details</h1>
      </div>

      {/* Station Info */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{station.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="font-medium">{station.rating}</span>
                <span className="text-sm text-muted-foreground">({station.reviewCount} reviews)</span>
              </div>
              <Badge variant="secondary">{station.openHours}</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-sm">{station.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <span className="text-sm">{station.distance} away</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <span className="text-sm">{station.phone}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Navigation className="h-4 w-4 mr-2" />
              Directions
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
          </div>
        </div>
      </Card>

      {/* Fuel Availability */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Fuel Availability</h2>
        <div className="space-y-3">
          {fuelTypes.map((fuel) => {
            const fuelData = availability[fuel.id as keyof typeof availability];
            return (
              <Card key={fuel.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{fuel.icon}</div>
                    <div>
                      <h3 className="font-medium">{fuel.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={getStockColor(fuelData.stock)}>
                          {fuelData.stock}
                        </span>
                        <span className="text-muted-foreground">
                          • Updated {fuelData.lastUpdated}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-primary">₦{fuelData.price}/{fuel.unit}</p>
                      {fuelData.available && (
                        <p className="text-xs text-green-600">Available</p>
                      )}
                    </div>
                    {getStockIcon(fuelData.available, fuelData.stock)}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Other Services */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Other Services</h2>
        <div className="space-y-3">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className={`p-4 ${service.name === 'Road Signs Guide' ? 'cursor-pointer hover:bg-accent' : ''}`}
              onClick={() => service.name === 'Road Signs Guide' && onNavigate ? onNavigate('road-signs') : undefined}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{service.icon}</div>
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.hours}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {service.available ? (
                    <>
                      <Badge variant="secondary" className="text-green-600 border-green-200">
                        Available
                      </Badge>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="text-red-600 border-red-200">
                        Unavailable
                      </Badge>
                      <XCircle className="h-5 w-5 text-red-500" />
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1">
          Add to Favorites
        </Button>
        <Button variant="fuel" className="flex-1">
          <Fuel className="h-4 w-4 mr-2" />
          Order Fuel
        </Button>
      </div>
    </div>
  );
};

export default StationDetailsScreen;