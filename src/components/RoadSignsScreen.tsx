import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Navigation, AlertTriangle, MapPin, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoadSignsScreenProps {
  onBack: () => void;
}

interface RoadSign {
  id: string;
  type: 'warning' | 'prohibition' | 'information' | 'mandatory';
  title: string;
  description: string;
  location: string;
  distance: string;
  severity: 'low' | 'medium' | 'high';
  icon: string;
}

const RoadSignsScreen: React.FC<RoadSignsScreenProps> = ({ onBack }) => {
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [currentSigns, setCurrentSigns] = useState<RoadSign[]>([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const { toast } = useToast();

  // Mock real-time road signs data
  const mockRoadSigns: RoadSign[] = [
    {
      id: '1',
      type: 'prohibition',
      title: 'No Left Turn',
      description: 'Left turn prohibited ahead at next intersection',
      location: 'Victoria Island Lagos',
      distance: '200m',
      severity: 'high',
      icon: '🚫'
    },
    {
      id: '2',
      type: 'warning',
      title: 'Speed Limit 50km/h',
      description: 'Reduce speed - residential area ahead',
      location: 'Lekki Phase 1',
      distance: '150m',
      severity: 'medium',
      icon: '⚠️'
    },
    {
      id: '3',
      type: 'information',
      title: 'Fuel Station Ahead',
      description: 'Total Energies fuel station on your right',
      location: 'Ajah',
      distance: '500m',
      severity: 'low',
      icon: 'ℹ️'
    },
    {
      id: '4',
      type: 'mandatory',
      title: 'Keep Right',
      description: 'Road work in progress - use right lane only',
      location: 'Third Mainland Bridge',
      distance: '1km',
      severity: 'high',
      icon: '➡️'
    }
  ];

  useEffect(() => {
    if (isLocationEnabled) {
      // Simulate real-time updates
      const interval = setInterval(() => {
        const randomSigns = mockRoadSigns
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(Math.random() * 3) + 1);
        setCurrentSigns(randomSigns);
        
        if (isVoiceEnabled && randomSigns.length > 0) {
          const highPrioritySigns = randomSigns.filter(sign => sign.severity === 'high');
          if (highPrioritySigns.length > 0) {
            announceSign(highPrioritySigns[0]);
          }
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isLocationEnabled, isVoiceEnabled]);

  const announceSign = (sign: RoadSign) => {
    if ('speechSynthesis' in window && isVoiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(
        `Attention: ${sign.title}. ${sign.description} in ${sign.distance}.`
      );
      utterance.rate = 0.8;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  const enableLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocationEnabled(true);
          toast({
            title: 'Location Enabled',
            description: 'Real-time road signs will now be displayed based on your location.'
          });
        },
        () => {
          toast({
            title: 'Location Access Denied',
            description: 'Please enable location access for real-time road signs.',
            variant: 'destructive'
          });
        }
      );
    }
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled);
    toast({
      title: isVoiceEnabled ? 'Voice Assistant Disabled' : 'Voice Assistant Enabled',
      description: isVoiceEnabled 
        ? 'Road sign announcements turned off.'
        : 'Road signs will now be announced audibly.'
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prohibition': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'mandatory': return 'bg-blue-500';
      case 'information': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Road Signs Guide</h1>
            <p className="text-sm text-muted-foreground">Real-time traffic information</p>
          </div>
          <Button 
            variant={isVoiceEnabled ? "default" : "outline"}
            size="icon"
            onClick={toggleVoice}
            className="ml-2"
          >
            {isVoiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">

        {/* Location Status */}
        {!isLocationEnabled ? (
          <Card className="p-6 text-center">
            <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Enable Location Services</h3>
            <p className="text-muted-foreground mb-4">
              Allow location access to receive real-time road signs and traffic information while driving.
            </p>
            <Button onClick={enableLocation} className="w-full">
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location
            </Button>
          </Card>
        ) : (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-primary">Location Active</p>
                <p className="text-sm text-muted-foreground">Monitoring road signs in real-time</p>
              </div>
            </div>
          </Card>
        )}

        {/* Voice Assistant Status */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isVoiceEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {isVoiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </div>
              <div>
                <h3 className="font-medium">AI Voice Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  {isVoiceEnabled ? 'Announcing important road signs' : 'Accessibility feature for visually impaired'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={toggleVoice}>
              {isVoiceEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </Card>

        {/* Current Road Signs */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Active Road Signs
          </h2>
          
          {currentSigns.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="text-4xl mb-2">🛣️</div>
              <p className="text-muted-foreground">
                {isLocationEnabled 
                  ? 'No active road signs in your area. Safe driving!' 
                  : 'Enable location to see real-time road signs.'
                }
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {currentSigns.map((sign) => (
                <Card key={sign.id} className="p-4 border-l-4 border-l-orange-500">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white ${getTypeColor(sign.type)}`}>
                      <span className="text-xl">{sign.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{sign.title}</h3>
                        <Badge variant={getSeverityColor(sign.severity) as any}>
                          {sign.distance}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{sign.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{sign.location}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Road Sign Legend */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Sign Types</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Prohibition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Mandatory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Information</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};


export default RoadSignsScreen;