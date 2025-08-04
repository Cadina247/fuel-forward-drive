import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Fuel, 
  Truck, 
  QrCode, 
  Zap, 
  CreditCard, 
  Search,
  Bell,
  Star,
  Clock,
  MapPin,
  Percent
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Good morning, Obehi! ☀️</h1>
            <p className="text-muted-foreground">Ready for fuel delivery?</p>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search fuel stations, services..." 
          className="pl-10 bg-white/80 backdrop-blur-sm border-border/50"
        />
      </div>

      {/* Ad Banner */}
      <Card className="p-4 bg-gradient-fuel text-white border-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">20% Off First Delivery!</h3>
            <p className="text-sm opacity-90">Use code: FUEL20</p>
          </div>
          <Percent className="h-8 w-8 opacity-80" />
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="quick" 
            className="h-24 flex-col"
            onClick={() => onNavigate('order-fuel')}
          >
            <Fuel className="h-6 w-6 mb-2" />
            <span>Order Fuel</span>
          </Button>
          <Button 
            variant="quick" 
            className="h-24 flex-col"
            onClick={() => onNavigate('track-order')}
          >
            <Truck className="h-6 w-6 mb-2" />
            <span>Track Order</span>
          </Button>
          <Button 
            variant="quick" 
            className="h-24 flex-col"
            onClick={() => onNavigate('token-generator')}
          >
            <QrCode className="h-6 w-6 mb-2" />
            <span>Generate Token</span>
          </Button>
          <Button 
            variant="quick" 
            className="h-24 flex-col"
            onClick={() => onNavigate('ev-charging')}
          >
            <Zap className="h-6 w-6 mb-2" />
            <span>EV Charging</span>
          </Button>
        </div>
      </div>

      {/* Additional Services */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">More Services</h2>
        <div className="space-y-3">
          <Card className="p-4 hover:shadow-soft transition-all cursor-pointer" onClick={() => onNavigate('soft-loan')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-energy rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Soft Loan</h3>
                  <p className="text-sm text-muted-foreground">Quick fuel financing</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-secondary">Available</p>
                <p className="text-xs text-muted-foreground">Up to ₦50k</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-soft transition-all cursor-pointer" onClick={() => onNavigate('prohibited-parking')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive rounded-lg flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Parking Zones</h3>
                  <p className="text-sm text-muted-foreground">Avoid restricted areas</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Petrol Delivery</h3>
                <p className="text-sm text-muted-foreground">Completed • ₦15,000</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm">4.8</span>
              </div>
              <p className="text-xs text-muted-foreground">2 hours ago</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Promotional Section */}
      <Card className="p-4 bg-gradient-energy text-white border-none">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Join FuelNow Premium</h3>
            <p className="text-sm opacity-90">Free delivery & exclusive offers</p>
            <Button variant="secondary" size="sm" className="mt-2">
              Learn More
            </Button>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₦0</div>
            <div className="text-xs opacity-80">delivery fee</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HomeScreen;