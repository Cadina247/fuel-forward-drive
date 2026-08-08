import React from 'react';
import { Button } from '@/components/ui/button';
import CadinatechLogo from '@/components/brand/CadinatechLogo';
import { 
  Home, 
  Search, 
  MapPin, 
  User, 
  ShoppingCart,
  Menu
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab = 'home', onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'orders', icon: ShoppingCart, label: 'Orders' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-gradient-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <CadinatechLogo size={34} />
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-t border-border/50 p-2">
        <div className="flex justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`flex-col h-12 w-16 ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground'
                }`}
                onClick={() => onTabChange?.(tab.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs mt-1">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;