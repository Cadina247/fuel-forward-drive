import React, { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'
import { Fuel, Mail, Phone } from 'lucide-react'

type Method = 'email' | 'phone'

const AuthScreen: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<Method>('email')
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpName, setOtpName] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')

  const fail = (title: string, err: any) =>
    toast({ title, description: err?.message || 'Please try again', variant: 'destructive' })

  const onEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: String(form.get('email') || ''),
        password: String(form.get('password') || ''),
      })
      if (error) throw error
      toast({ title: 'Welcome back!' })
    } catch (err) {
      fail('Sign in failed', err)
    } finally {
      setLoading(false)
    }
  }

  const onEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: String(form.get('password') || ''),
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: String(form.get('full_name') || ''),
            email,
            phone: String(form.get('phone') || '') || null,
          },
        },
      })
      if (error) throw error
      if (data.session) {
        toast({ title: 'Account created 🎉', description: 'You are signed in.' })
      } else {
        toast({ title: 'Almost there', description: 'Check your email to confirm your account.' })
      }
    } catch (err) {
      fail('Sign up failed', err)
    } finally {
      setLoading(false)
    }
  }

  const sendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: otpPhone,
        options: {
          data: { full_name: otpName || null, phone: otpPhone, email: otpEmail || null },
        },
      })
      if (error) throw error
      setOtpSent(true)
      toast({ title: 'Code sent 📲', description: `We texted a 6-digit code to ${otpPhone}` })
    } catch (err) {
      fail('Could not send code', err)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: otpPhone,
        token: otpCode,
        type: 'sms',
      })
      if (error) throw error
      toast({ title: 'Signed in 🎉' })
    } catch (err) {
      fail('Invalid code', err)
    } finally {
      setLoading(false)
    }
  }

  // NOTE: these are plain render functions (not nested components) so React does
  // not unmount/remount the inputs on every keystroke — that was causing the
  // keyboard to close and focus to be lost mid-typing on mobile.
  const renderMethodSwitch = () => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <Button
        type="button"
        variant={method === 'email' ? 'default' : 'secondary'}
        onClick={() => setMethod('email')}
      >
        <Mail className="h-4 w-4 mr-2" /> Email
      </Button>
      <Button
        type="button"
        variant={method === 'phone' ? 'default' : 'secondary'}
        onClick={() => setMethod('phone')}
      >
        <Phone className="h-4 w-4 mr-2" /> Phone
      </Button>
    </div>
  )

  const renderPhoneFlow = (withName: boolean, keyPrefix: string) =>
    !otpSent ? (
      <form key={`${keyPrefix}-otp-send`} onSubmit={sendOtp} className="space-y-4">
        {withName && (
          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-otp-name`}>Full name</Label>
            <Input
              id={`${keyPrefix}-otp-name`}
              value={otpName}
              onChange={(e) => setOtpName(e.target.value)}
              placeholder="Obehi Osagie"
              autoComplete="name"
              autoCapitalize="words"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}-otp-phone`}>Phone number</Label>
          <Input
            id={`${keyPrefix}-otp-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={otpPhone}
            onChange={(e) => setOtpPhone(e.target.value)}
            placeholder="+2348012345678"
            required
          />
        </div>
        {withName && (
          <div className="space-y-2">
            <Label htmlFor={`${keyPrefix}-otp-email`}>Email (optional)</Label>
            <Input
              id={`${keyPrefix}-otp-email`}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending…' : 'Send code'}
        </Button>
      </form>
    ) : (
      <form key={`${keyPrefix}-otp-verify`} onSubmit={verifyOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}-otp-code`}>6-digit code</Label>
          <Input
            id={`${keyPrefix}-otp-code`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & continue'}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => setOtpSent(false)}>
          Use a different number
        </Button>
      </form>
    )


  return (
    <div className="min-h-screen bg-gradient-background flex flex-col justify-center p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center mb-3">
          <Fuel className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Welcome to FuelNow</h1>
        <p className="text-muted-foreground text-sm">Fuel delivery, on your terms</p>
      </div>

      <Card className="p-4">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            {renderMethodSwitch()}
            {method === 'email' ? (
              <form key="email-signin" onSubmit={onEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Please wait…' : 'Login'}
                </Button>
              </form>
            ) : (
              renderPhoneFlow(false, 'login')
            )}
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            {renderMethodSwitch()}
            {method === 'email' ? (
              <form key="email-signup" onSubmit={onEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full name</Label>
                  <Input id="signup-name" name="full_name" placeholder="Obehi Osagie" autoComplete="name" autoCapitalize="words" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone (optional)</Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="+2348012345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Create a strong password"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating…' : 'Create Account'}
                </Button>
              </form>
            ) : (
              renderPhoneFlow(true, 'signup')
            )}
          </TabsContent>

        </Tabs>
      </Card>
    </div>
  )
}

export default AuthScreen
