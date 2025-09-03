import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import HomeScreen from '@/components/HomeScreen';
import OrderFuelScreen from '@/components/OrderFuelScreen';
import StationDetailsScreen from '@/components/StationDetailsScreen';
import TokenGeneratorScreen from '@/components/TokenGeneratorScreen';
import EVChargingScreen from '@/components/EVChargingScreen';
import SoftLoanScreen from '@/components/SoftLoanScreen';
import TrackOrderScreen from '@/components/TrackOrderScreen';
import RoadSignsScreen from '@/components/RoadSignsScreen';
import CookingGasScreen from '@/components/CookingGasScreen';
import AuthScreen from '@/components/AuthScreen';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const { toast } = useToast();

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleStationClick = (stationId: string) => {
    setSelectedStationId(stationId);
    setCurrentScreen('station-details');
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'orders') {
      setCurrentScreen('track-order');
    } else {
      setCurrentScreen(tab);
    }
  };

  const handlePlaceOrder = (orderData: any) => {
    // Generate PODC and show success
    const podc = Math.floor(100000 + Math.random() * 900000).toString();
    
    toast({
      title: "Order Placed Successfully! 🎉",
      description: `Your PODC is ${podc}. Estimated delivery: 15-25 minutes`,
      duration: 5000,
    });

    // Navigate to tracking screen
    setCurrentScreen('track-order');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'order-fuel':
        return (
          <OrderFuelScreen 
            onBack={() => setCurrentScreen('home')} 
            onPlaceOrder={handlePlaceOrder}
            onStationClick={handleStationClick}
          />
        );
      case 'station-details':
        return (
          <StationDetailsScreen 
            onBack={() => setCurrentScreen('order-fuel')} 
            stationId={selectedStationId}
            onNavigate={handleNavigate}
          />
        );
      case 'token-generator':
        return <TokenGeneratorScreen onBack={() => setCurrentScreen('home')} />;
      case 'ev-charging':
        return <EVChargingScreen onBack={() => setCurrentScreen('home')} />;
      case 'soft-loan':
        return <SoftLoanScreen onBack={() => setCurrentScreen('home')} />;
      case 'track-order':
        return <TrackOrderScreen onBack={() => setCurrentScreen('home')} />;
      case 'road-signs':
        return <RoadSignsScreen onBack={() => setCurrentScreen('home')} />;
      case 'cooking-gas':
        return <CookingGasScreen onBack={() => setCurrentScreen('home')} />;
      case 'search':
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Search</h1>
            <p className="text-muted-foreground">Search functionality coming soon...</p>
          </div>
        );
      case 'map':
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Map View</h1>
            <p className="text-muted-foreground">Interactive map with fuel stations coming soon...</p>
          </div>
        );
      case 'profile':
        return <AuthScreen />;
      case 'prohibited-parking':
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Prohibited Parking Zones</h1>
            <p className="text-muted-foreground">Parking restriction map coming soon...</p>
          </div>
        );
      case 'parking-lot':
        return (
          <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Parking Lot Nearby</h1>
            <p className="text-muted-foreground">Finding available parking spots near you...</p>
          </div>
        );
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderScreen()}
    </Layout>
  );
};

export default Index;
