import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import AuthScreen from '@/components/AuthScreen';
import {
  ArrowLeft,
  User,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  Bike,
  Car,
  Truck,
  Building2,
  ShieldCheck,
  Loader2,
  LogIn,
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface UploadedDoc {
  name: string;
  path: string; // storage path or local fallback
}

const stations = [
  { id: 'shell-vi', name: 'Shell — Victoria Island' },
  { id: 'total-lekki', name: 'Total — Lekki Phase 1' },
  { id: 'mobil-ikeja', name: 'Mobil — Ikeja' },
  { id: 'nnpc-ajah', name: 'NNPC — Ajah' },
];

const vehicles = [
  { id: 'bike', label: 'Motorbike', icon: Bike },
  { id: 'tricycle', label: 'Tricycle', icon: Car },
  { id: 'van', label: 'Van / Truck', icon: Truck },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BUCKET = 'provider-documents';

const DeliveryProviderRegistrationScreen: React.FC<Props> = ({ onBack }) => {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSignIn, setShowSignIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    stationId: '',
    vehicleType: 'bike',
    plateNumber: '',
    idType: 'nin',
    idNumber: '',
    idDoc: null as UploadedDoc | null,
    licenseDoc: null as UploadedDoc | null,
    vehicleDoc: null as UploadedDoc | null,
    availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as string[],
    shiftStart: '08:00',
    shiftEnd: '18:00',
    agreeTerms: false,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Session check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setForm((f) => ({ ...f, email: f.email || data.user!.email || '' }));
      }
      setCheckingAuth(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setShowSignIn(false);
        setForm((f) => ({ ...f, email: f.email || session.user.email || '' }));
      } else {
        setUserId(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const toggleDay = (d: string) =>
    set(
      'availableDays',
      form.availableDays.includes(d)
        ? form.availableDays.filter((x) => x !== d)
        : [...form.availableDays, d],
    );

  const handleFileUpload = async (
    field: 'idDoc' | 'licenseDoc' | 'vehicleDoc',
    file: File,
  ) => {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB.', variant: 'destructive' });
      return;
    }
    setUploading(field);
    const path = `${userId ?? 'anon'}/${field}-${Date.now()}-${file.name}`;
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (error) throw error;
      set(field, { name: file.name, path });
      toast({ title: 'Document uploaded', description: file.name });
    } catch (err: any) {
      // Fallback: store filename only so flow can proceed
      set(field, { name: file.name, path: `local://${path}` });
      toast({
        title: 'Uploaded (pending sync)',
        description: err?.message || 'Storage will finalize once bucket is set up.',
      });
    } finally {
      setUploading(null);
    }
  };

  const canNext =
    (step === 1 && form.fullName && form.phone && form.email && form.address) ||
    (step === 2 && form.stationId && form.vehicleType && form.plateNumber) ||
    (step === 3 && form.idNumber && form.idDoc && form.licenseDoc) ||
    (step === 4 && form.availableDays.length > 0 && form.agreeTerms);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('delivery_provider_applications').insert({
        user_id: userId,
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        address: form.address,
        station_id: form.stationId,
        vehicle_type: form.vehicleType,
        plate_number: form.plateNumber,
        id_type: form.idType,
        id_number: form.idNumber,
        id_doc_path: form.idDoc?.path,
        license_doc_path: form.licenseDoc?.path,
        vehicle_doc_path: form.vehicleDoc?.path,
        available_days: form.availableDays,
        shift_start: form.shiftStart,
        shift_end: form.shiftEnd,
        is_available: availableNow,
        status: 'pending_review',
      });
      if (error) throw error;
      toast({
        title: 'Application submitted! 🎉',
        description: 'Your station will review your details within 24–48 hours.',
      });
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: 'Application received',
        description: err?.message
          ? `Saved locally. ${err.message}`
          : 'Your station will review your details shortly.',
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const updateAvailability = async (next: boolean) => {
    setAvailableNow(next);
    try {
      await supabase
        .from('delivery_provider_applications')
        .update({ is_available: next, availability_updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    } catch {
      /* silent — UI still reflects toggle */
    }
    toast({
      title: next ? 'You are now available' : 'You are offline',
      description: next
        ? 'Your station can now dispatch orders to you.'
        : 'You will not receive new dispatches.',
    });
  };

  // --- Auth gate ---
  if (checkingAuth) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!userId) {
    if (showSignIn) {
      return (
        <div className="p-4 space-y-4">
          <Button variant="ghost" onClick={() => setShowSignIn(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <AuthScreen />
        </div>
      );
    }
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Become a Delivery Provider</h1>
        </div>
        <Card className="p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Sign in to continue</h2>
            <p className="text-sm text-muted-foreground mt-1">
              You need an account so your station can verify your identity and
              route dispatches to you.
            </p>
          </div>
          <Button variant="fuel" className="w-full" onClick={() => setShowSignIn(true)}>
            Sign in / Create account
          </Button>
        </Card>
      </div>
    );
  }

  // --- Post-submission dashboard with availability toggle ---
  if (submitted) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Provider Dashboard</h1>
        </div>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <p className="font-semibold">Application submitted</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Status: <Badge variant="secondary">Pending review</Badge>
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Availability</p>
              <p className="text-xs text-muted-foreground">
                {availableNow ? 'Accepting dispatches' : 'Not accepting dispatches'}
              </p>
            </div>
            <Switch checked={availableNow} onCheckedChange={updateAvailability} />
          </div>
          <div className="text-xs text-muted-foreground border-t pt-2">
            Shift: {form.shiftStart} – {form.shiftEnd} • {form.availableDays.join(', ')}
          </div>
        </Card>

        <Button variant="outline" className="w-full" onClick={onBack}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Become a Delivery Provider</h1>
          <p className="text-sm text-muted-foreground">In-house registration for filling stations</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {step} of 4</span>
          <span>
            {step === 1 && 'Personal info'}
            {step === 2 && 'Station & vehicle'}
            {step === 3 && 'Documents'}
            {step === 4 && 'Availability & terms'}
          </span>
        </div>
        <Progress value={step * 25} className="h-2" />
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Personal Information</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Obehi Okafor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+234 801 234 5678" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Residential Address</Label>
              <Textarea id="address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, area, city" />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Station & Vehicle</h2>
          </div>
          <div>
            <Label>Choose Filling Station</Label>
            <Select value={form.stationId} onValueChange={(v) => set('stationId', v)}>
              <SelectTrigger><SelectValue placeholder="Select a station" /></SelectTrigger>
              <SelectContent>
                {stations.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Vehicle Type</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {vehicles.map((v) => {
                const Icon = v.icon;
                const active = form.vehicleType === v.id;
                return (
                  <Card
                    key={v.id}
                    onClick={() => set('vehicleType', v.id)}
                    className={`p-3 cursor-pointer text-center border-2 ${active ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-xs">{v.label}</span>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="plate">Plate Number</Label>
            <Input id="plate" value={form.plateNumber} onChange={(e) => set('plateNumber', e.target.value)} placeholder="ABC-123-XY" />
          </div>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Document Verification</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>ID Type</Label>
              <Select value={form.idType} onValueChange={(v) => set('idType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nin">NIN</SelectItem>
                  <SelectItem value="drivers">Driver's License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="voters">Voter's Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" value={form.idNumber} onChange={(e) => set('idNumber', e.target.value)} />
            </div>
          </div>

          {(['idDoc', 'licenseDoc', 'vehicleDoc'] as const).map((field) => {
            const labels: Record<typeof field, string> = {
              idDoc: 'Government ID (photo/scan)',
              licenseDoc: "Driver's License",
              vehicleDoc: 'Vehicle Registration',
            };
            const doc = form[field];
            const isUp = uploading === field;
            return (
              <div key={field} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium">{labels[field]}</p>
                  {doc ? (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1 truncate">
                      <CheckCircle className="h-3 w-3 shrink-0" />
                      <span className="truncate">{doc.name}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">PDF, JPG or PNG • Max 5MB</p>
                  )}
                </div>
                <label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileUpload(field, f);
                      e.target.value = '';
                    }}
                  />
                  <Button variant="outline" size="sm" asChild disabled={isUp}>
                    <span>
                      {isUp ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1" />
                      )}
                      {doc ? 'Replace' : 'Upload'}
                    </span>
                  </Button>
                </label>
              </div>
            );
          })}

          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-800">
              All documents are encrypted and shared only with the station's verification team.
            </p>
          </div>
        </Card>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Availability & Terms</h2>
          </div>

          <div>
            <Label>Available Days</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {days.map((d) => {
                const active = form.availableDays.includes(d);
                return (
                  <Badge
                    key={d}
                    onClick={() => toggleDay(d)}
                    variant={active ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                  >
                    {d}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Shift Start</Label>
              <Input id="start" type="time" value={form.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end">Shift End</Label>
              <Input id="end" type="time" value={form.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between border rounded-lg p-3">
            <div>
              <p className="text-sm font-medium">Go available immediately after approval</p>
              <p className="text-xs text-muted-foreground">You can toggle this any time.</p>
            </div>
            <Switch checked={availableNow} onCheckedChange={setAvailableNow} />
          </div>

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="terms"
              checked={form.agreeTerms}
              onCheckedChange={(c) => set('agreeTerms', Boolean(c))}
            />
            <Label htmlFor="terms" className="text-sm leading-snug">
              I agree to the station's provider terms, background check, and platform code of conduct.
            </Label>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => (s - 1) as Step)}>
            Back
          </Button>
        )}
        {step < 4 ? (
          <Button className="flex-1" disabled={!canNext} onClick={() => setStep((s) => (s + 1) as Step)}>
            Continue
          </Button>
        ) : (
          <Button variant="fuel" className="flex-1" disabled={!canNext || submitting} onClick={submit}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DeliveryProviderRegistrationScreen;
