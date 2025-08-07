import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MapPin, Navigation } from 'lucide-react';

interface RoadSignsScreenProps {
  onBack: () => void;
}

const RoadSignsScreen: React.FC<RoadSignsScreenProps> = ({ onBack }) => {
  const [currentRoute] = useState("Lagos-Ibadan Expressway");

  const regulatorySigns = [
    { name: "No Entry", icon: "⛔", description: "Entry prohibited" },
    { name: "No Parking", icon: "🚫🅿️", description: "Parking not allowed" },
    { name: "No Overtaking", icon: "🚫⬅️", description: "Overtaking prohibited" },
    { name: "No U-Turn", icon: "🔄🚫", description: "U-turns not permitted" },
    { name: "No Left Turn", icon: "⬅️🚫", description: "Left turns prohibited" },
    { name: "No Right Turn", icon: "➡️🚫", description: "Right turns prohibited" },
    { name: "Speed Limit 50", icon: "🛑50", description: "Maximum speed 50 km/h" },
    { name: "No Horn", icon: "🔊🚫", description: "Horn use prohibited" },
    { name: "Turn Left Only", icon: "⬅️", description: "Mandatory left turn" },
    { name: "Turn Right Only", icon: "➡️", description: "Mandatory right turn" },
    { name: "Straight Ahead", icon: "⬆️", description: "Straight ahead only" },
    { name: "Keep Left", icon: "↙️", description: "Keep to the left" },
    { name: "Keep Right", icon: "↘️", description: "Keep to the right" },
    { name: "Roundabout", icon: "⭕", description: "Roundabout ahead" }
  ];

  const warningSigns = [
    { name: "Curve Ahead", icon: "↪️", description: "Sharp curve approaching" },
    { name: "Double Bend", icon: "〰️", description: "Series of curves ahead" },
    { name: "Steep Hill", icon: "⛰️", description: "Steep incline/decline" },
    { name: "Pedestrian Crossing", icon: "🚸", description: "Pedestrian crossing ahead" },
    { name: "Children Crossing", icon: "👶", description: "School zone - children crossing" },
    { name: "Slippery Road", icon: "💧", description: "Road may be slippery" },
    { name: "Traffic Signals", icon: "🚦", description: "Traffic lights ahead" },
    { name: "Uneven Road", icon: "🛣️", description: "Road surface irregular" },
    { name: "Road Narrows", icon: "🔄", description: "Road width reduces" },
    { name: "Cattle Crossing", icon: "🐄", description: "Animals may cross" },
    { name: "Falling Rocks", icon: "🪨", description: "Rockfall zone" },
    { name: "Crosswinds", icon: "💨", description: "Strong winds possible" }
  ];

  const informationalSigns = [
    { name: "Hospital", icon: "🏥", description: "Medical facility ahead" },
    { name: "Petrol Station", icon: "⛽", description: "Fuel station ahead" },
    { name: "Parking", icon: "🅿️", description: "Parking area" },
    { name: "Rest Area", icon: "🛏️", description: "Rest stop available" },
    { name: "Airport", icon: "✈️", description: "Airport direction" },
    { name: "Police Station", icon: "👮‍♂️", description: "Police post ahead" },
    { name: "Toll Gate", icon: "🎫", description: "Toll collection point" },
    { name: "Bridge Ahead", icon: "🌉", description: "Bridge crossing" },
    { name: "Ferry", icon: "⛴️", description: "Ferry terminal" }
  ];

  const constructionSigns = [
    { name: "Men at Work", icon: "👷", description: "Construction zone - workers present" },
    { name: "Road Closed", icon: "🚧", description: "Road temporarily closed" },
    { name: "Detour Ahead", icon: "↪️", description: "Alternative route required" },
    { name: "Temporary Traffic Light", icon: "🚦", description: "Temporary signal control" },
    { name: "Flagman Ahead", icon: "🚩", description: "Traffic controller present" },
    { name: "Loose Gravel", icon: "🪨", description: "Loose road surface" },
    { name: "Speed Bump", icon: "⚡", description: "Speed reduction ahead" }
  ];

  const activeRouteSigns = [
    { sign: "Speed Limit 50", distance: "200m", status: "active" },
    { sign: "Curve Ahead", distance: "500m", status: "upcoming" },
    { sign: "Petrol Station", distance: "1.2km", status: "upcoming" },
    { sign: "Traffic Signals", distance: "2km", status: "upcoming" }
  ];

  const SignCard = ({ signs }: { signs: Array<{ name: string; icon: string; description: string }> }) => (
    <div className="grid grid-cols-2 gap-3">
      {signs.map((sign, index) => (
        <Card key={index} className="p-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{sign.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium text-sm">{sign.name}</h4>
              <p className="text-xs text-muted-foreground">{sign.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Road Signs Guide</h1>
          <p className="text-muted-foreground">Real-time road signs for your journey</p>
        </div>
      </div>

      {/* Current Route Signs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Active Route: {currentRoute}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activeRouteSigns.map((routeSign, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">{routeSign.sign}</p>
                  <p className="text-sm text-muted-foreground">Distance: {routeSign.distance}</p>
                </div>
              </div>
              <Badge variant={routeSign.status === 'active' ? 'default' : 'secondary'}>
                {routeSign.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Road Signs Categories */}
      <Tabs defaultValue="regulatory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regulatory">Regulatory</TabsTrigger>
          <TabsTrigger value="warning">Warning</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="construction">Construction</TabsTrigger>
        </TabsList>

        <TabsContent value="regulatory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚫 Regulatory Signs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Control and prohibitive signs - what must or must not be done
              </p>
            </CardHeader>
            <CardContent>
              <SignCard signs={regulatorySigns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ⚠️ Warning Signs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Alert drivers to potential hazards or changes in road conditions
              </p>
            </CardHeader>
            <CardContent>
              <SignCard signs={warningSigns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚸 Informational Signs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide directions and general road information
              </p>
            </CardHeader>
            <CardContent>
              <SignCard signs={informationalSigns} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="construction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🛠️ Construction Signs
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Used near construction zones or detours
              </p>
            </CardHeader>
            <CardContent>
              <SignCard signs={constructionSigns} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Traffic Light Guide */}
      <Card>
        <CardHeader>
          <CardTitle>🚥 Traffic Light Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="font-medium">Red</span>
              <span className="text-muted-foreground">- Stop completely</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">Yellow/Amber</span>
              <span className="text-muted-foreground">- Prepare to stop</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Green</span>
              <span className="text-muted-foreground">- Proceed with caution</span>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">Green Arrow</span>
              <span className="text-muted-foreground">- Direction-specific go</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoadSignsScreen;