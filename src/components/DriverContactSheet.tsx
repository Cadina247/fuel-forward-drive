import React, { useEffect, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Send, User, Truck, Star } from 'lucide-react';

export interface DriverInfo {
  name: string;
  phone: string;
  vehicle: string;
  rating: number;
  isOnline?: boolean;
  etaMinutes?: number;
}

interface Message {
  id: string;
  from: 'me' | 'driver';
  text: string;
  at: number;
}

const QUICK_REPLIES = [
  "I'm at the gate",
  'Please call when you arrive',
  'How far away are you?',
  'Use the back entrance',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: DriverInfo;
  defaultTab?: 'call' | 'chat';
}

const DriverContactSheet: React.FC<Props> = ({ open, onOpenChange, driver, defaultTab = 'call' }) => {
  const [tab, setTab] = useState<'call' | 'chat'>(defaultTab);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', from: 'driver', text: `Hi, this is ${driver.name}. I'm on the way with your order.`, at: Date.now() - 120000 },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, tab]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setMessages((prev) => [...prev, { id: `${Date.now()}`, from: 'me', text: value, at: Date.now() }]);
    setDraft('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-d`, from: 'driver', text: 'Got it 👍', at: Date.now() },
      ]);
    }, 1200);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="p-4 pb-3 border-b">
          <SheetTitle className="flex items-center gap-3 text-left">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-semibold">{driver.name}</div>
              <div className="text-xs font-normal text-muted-foreground flex items-center gap-2">
                <Truck className="h-3 w-3" /> {driver.vehicle}
                <Star className="h-3 w-3 text-yellow-500 fill-current" /> {driver.rating}
              </div>
            </div>
            <Badge variant={driver.isOnline === false ? 'destructive' : 'default'}>
              {driver.isOnline === false ? 'Offline' : 'Online'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'call' | 'chat')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-2 mx-4 mt-3">
            <TabsTrigger value="call">
              <Phone className="h-4 w-4 mr-2" /> Call
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" /> Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent value="call" className="p-4 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">Driver phone number</p>
              <p className="text-xl font-semibold tracking-wide">{driver.phone}</p>
              {driver.etaMinutes != null && (
                <p className="text-sm text-muted-foreground">Arriving in about {driver.etaMinutes} minutes</p>
              )}
            </div>
            <Button asChild size="lg" className="w-full">
              <a href={`tel:${driver.phone.replace(/\s/g, '')}`}>
                <Phone className="h-5 w-5 mr-2" /> Call {driver.name.split(' ')[0]}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href={`sms:${driver.phone.replace(/\s/g, '')}`}>
                <MessageSquare className="h-5 w-5 mr-2" /> Send SMS
              </a>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Calls are placed with your own network. Never share your PODC before delivery.
            </p>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 mt-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    {m.text}
                    <div className="text-[10px] opacity-70 mt-1">
                      {new Date(m.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {QUICK_REPLIES.map((q) => (
                <Button key={q} variant="outline" size="sm" className="whitespace-nowrap" onClick={() => send(q)}>
                  {q}
                </Button>
              ))}
            </div>

            <form
              className="p-4 pt-2 border-t flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Message your driver…"
                autoComplete="off"
              />
              <Button type="submit" size="icon" disabled={!draft.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default DriverContactSheet;
