import React, { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'
import CadinatechLogo from '@/components/brand/CadinatechLogo'
import { Fuel, Mail, Phone, Eye, EyeOff } from 'lucide-react'

type Method = 'email' | 'phone'

/** Standard multi-colour Google "G" mark. */
const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.29-3.14.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
)


type PasswordToggleProps = {
  id: string
  name: string
  autoComplete: string
  placeholder: string
  showPassword: boolean
  setShowPassword: (show: boolean) => void
}

const PasswordToggle: React.FC<PasswordToggleProps> = ({
  id,
  name,
  autoComplete,
  placeholder,
  showPassword,
  setShowPassword,
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>Password</Label>
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder={placeholder}
        required
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  </div>
)

const AuthScreen: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<Method>('email')
  const [otpSent, setOtpSent] = useState(false)
  const [otpPhone, setOtpPhone] = useState('')
  const [otpName, setOtpName] = useState('')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showSignupPassword, setShowSignupPassword] = useState(false)


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

  const onGoogleAuth = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      })
      if (error) throw error
      // Browser redirects to Google; nothing else to do here.
    } catch (err) {
      fail('Google sign-in failed', err)
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
        <CadinatechLogo size={72} orientation="vertical" className="mb-3" />
        <h1 className="text-2xl font-bold text-foreground">Welcome to Cadinatech</h1>
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
                <PasswordToggle
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  showPassword={showLoginPassword}
                  setShowPassword={setShowLoginPassword}
                />
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
                <PasswordToggle
                  id="signup-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  showPassword={showSignupPassword}
                  setShowPassword={setShowSignupPassword}
                />
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
