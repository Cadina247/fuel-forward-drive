import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star,
  Navigation,
  Filter,
  Battery,
  Plug
} from 'lucide-react';

interface EVChargingScreenProps {
  onBack: () => void;
}

const EVChargingScreen: React.FC<EVChargingScreenProps> = ({ onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const chargingStations = [
    {
      id: 1,
      name: 'Tesla Supercharger - VI',
      type: 'DC Fast',
      power: '150kW',
      price: 45,
      distance: '1.2 km',
      available: 4,
      total: 8,
      rating: 4.9,
      address: 'Plot 1A, Tiamiyu Savage Street, Victoria Island'
    },
    {
      id: 2,
      name: 'Shell Recharge - Lekki',
      type: 'AC/DC',
      power: '50kW',
      price: 35,
      distance: '2.8 km',
      available: 2,
      total: 6,
      rating: 4.7,
      address: 'KM 30, Lekki-Epe Expressway, Lekki Phase 1'
    },
    {
      id: 3,
      name: 'Total Energy - Ikeja',
      type: 'AC Standard',
      power: '22kW',
      price: 25,
      distance: '5.1 km',
      available: 6,
      total: 10,
      rating: 4.5,
      address: '142 Awolowo Way, Ikeja, Lagos'
    },
    {
      id: 4,
      name: 'EV Power Hub - Ajah',
      type: 'DC Fast',
      power: '100kW',
      price: 40,
      distance: '3.5 km',
      available: 0,
      total: 4,
      rating: 4.6,
      address: 'Sangotedo Road, Ajah, Lagos'
    }
  ];

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'available', label: 'Available' },
    { id: 'dc-fast', label: 'DC Fast' },
    { id: 'ac-standard', label: 'AC Standard' }
  ];

  const filteredStations = chargingStations.filter(station => {
    if (selectedFilter === 'available') return station.available > 0;
    if (selectedFilter === 'dc-fast') return station.type.includes('DC');
    if (selectedFilter === 'ac-standard') return station.type.includes('AC') && !station.type.includes('DC');
    return true;
  });

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">EV Charging Stations</h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm text-muted-foreground">Available Slots</div>
        </Card>
        <Card className="p-4 text-center">
          <MapPin className="h-8 w-8 text-secondary mx-auto mb-2" />
          <div className="text-2xl font-bold">4</div>
          <div className="text-sm text-muted-foreground">Nearby Stations</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filter by</span>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <Button
              key={filter.id}
              variant={selectedFilter === filter.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFilter(filter.id)}
              className="whitespace-nowrap"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Charging Stations List */}
      <div className="space-y-4">
        {filteredStations.map((station) => (
          <Card key={station.id} className="p-4 hover:shadow-soft transition-all">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{station.name}</h3>
                  <p className="text-sm text-muted-foreground">{station.address}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{station.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{station.distance}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Plug className="h-4 w-4 text-primary" />
                    <span className="text-sm">{station.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-secondary" />
                    <span className="text-sm">{station.power}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">₦{station.price}/kWh</div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Available:</span>
                  <Badge 
                    variant={station.available > 0 ? "default" : "destructive"}
                    className={station.available > 0 ? "bg-green-100 text-green-800" : ""}
                  >
                    {station.available}/{station.total} slots
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                  <Button 
                    variant="energy" 
                    size="sm"
                    disabled={station.available === 0}
                  >
                    {station.available > 0 ? 'Reserve' : 'Full'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Map View Button */}
      <Button variant="outline" size="lg" className="w-full">
        <MapPin className="h-5 w-5 mr-2" />
        View on Map
      </Button>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Zap className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Charging Tips</h3>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• DC Fast charging is ideal for quick top-ups</li>
              <li>• AC charging is cheaper for overnight charging</li>
              <li>• Reserve slots during peak hours</li>
              <li>• Check your vehicle's max charging speed</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EVChargingScreen;