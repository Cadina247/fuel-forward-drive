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
import CookingGasScreen from '@/components/CookingGasScreen';
import DeliveryProviderRegistrationScreen from '@/components/DeliveryProviderRegistrationScreen';
import StationIncomingOrdersScreen from '@/components/StationIncomingOrdersScreen';
import OrderAwaitingScreen from '@/components/OrderAwaitingScreen';
import AuthScreen from '@/components/AuthScreen';
import FundWalletScreen from '@/components/FundWalletScreen';

import ProfileScreen from '@/components/ProfileScreen';
import { useAuth } from '@/contexts/AuthContext';
import { OrderBroadcast, IncomingOrder } from '@/services/OrderBroadcast';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [pendingOrder, setPendingOrder] = useState<IncomingOrder | null>(null);
  const { toast } = useToast();
  const { session, profile, loading } = useAuth();
  const userName = profile?.full_name ?? undefined;

  // Live push/in-app alerts for order + EV booking/port changes.
  const { permission, enablePush } = useAppNotifications(session?.user?.id ?? null);

  useEffect(() => {
    if (session?.user && permission === 'default') {
      // Ask once, right after sign-in, so status changes can be pushed.
      enablePush();
    }
  }, [session?.user, permission, enablePush]);


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
    // New flow: the customer already picked a specific station, so we skip the
    // broadcast/auction and record the order with a pending payment state.
    if (orderData?.paymentStatus === 'pending') {
      toast({
        title: 'Order placed 🚚',
        description: orderData?.walletPaid
          ? `${orderData.station?.name} will confirm shortly. Paid from wallet.`
          : `${orderData.station?.name} will confirm shortly. Payment is pending.`,
        duration: 6000,
      });
      setTimeout(() => setCurrentScreen('track-order'), 1500);
      return;
    }


    const order: IncomingOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      customer: 'Obehi',
      fuelType: orderData?.fuelType ?? orderData?.fuel?.name ?? 'Petrol',
      quantity: Number(orderData?.quantity ?? 20),
      amount: Number(orderData?.totalAmount ?? orderData?.total ?? 0),
      address: orderData?.address ?? '12 Adeola Odeku St, VI',
      distanceKm: orderData?.distanceKm,
    };
    setPendingOrder(order);
    OrderBroadcast.broadcastOrder(order);
    toast({
      title: 'Request sent 📡',
      description: 'Notifying nearby filling stations…',
    });
    setCurrentScreen('order-awaiting');
  };

  const handlePaymentSuccess = (podc: string, station: { stationName: string }) => {
    toast({
      title: `Payment confirmed 🎉`,
      description: `${station.stationName} is preparing your order. PODC: ${podc}`,
      duration: 6000,
    });
    setPendingOrder(null);
    setCurrentScreen('track-order');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} userName={userName} />;

      case 'order-fuel':
        return (
          <OrderFuelScreen 
            onBack={() => setCurrentScreen('home')} 
            onPlaceOrder={handlePlaceOrder}
            onFundWallet={() => setCurrentScreen('fund-wallet')}
          />
        );
      case 'fund-wallet':
        return <FundWalletScreen onBack={() => setCurrentScreen('profile')} />;

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
      case 'delivery-provider-registration':
        return <DeliveryProviderRegistrationScreen onBack={() => setCurrentScreen('home')} />;
      case 'station-incoming':
        return <StationIncomingOrdersScreen onBack={() => setCurrentScreen('home')} />;
      case 'order-awaiting':
        return pendingOrder ? (
          <OrderAwaitingScreen
            order={pendingOrder}
            onPaid={handlePaymentSuccess}
            onCancel={() => {
              if (pendingOrder) OrderBroadcast.cancel(pendingOrder.id);
              setPendingOrder(null);
              setCurrentScreen('home');
            }}
          />
        ) : (
          <HomeScreen onNavigate={handleNavigate} />
        );
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
        return <ProfileScreen onNavigate={handleNavigate} />;


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
        return <HomeScreen onNavigate={handleNavigate} userName={userName} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderScreen()}
    </Layout>
  );
};


export default Index;
