import React, { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabaseClient'

const AuthScreen: React.FC = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const onSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast({ title: 'Signed in', description: `Welcome back${data.user?.email ? ', ' + data.user.email : ''}!` })
    } catch (err: any) {
      toast({ title: 'Sign in failed', description: err.message || 'Please try again', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const onSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast({ title: 'Account created', description: 'Check your email to confirm your account.' })
    } catch (err: any) {
      toast({ title: 'Sign up failed', description: err.message || 'Please try again', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (err: any) {
      toast({ title: 'Google sign-in failed', description: err.message || 'Please try again', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Login / Create Account</h1>
      <Card className="p-4">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={onSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" name="password" type="password" placeholder="••••••••" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Please wait…' : 'Login'}</Button>
              <Button type="button" variant="secondary" className="w-full" onClick={signInWithGoogle} disabled={loading}>
                Continue with Google
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={onSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" name="password" type="password" placeholder="Create a strong password" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating…' : 'Create Account'}</Button>
              <Button type="button" variant="secondary" className="w-full" onClick={signInWithGoogle} disabled={loading}>
                Sign up with Google
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        <p className="text-xs text-muted-foreground mt-4">Tip: Use the bottom navigation to return to Home after signing in.</p>
      </Card>
    </div>
  )
}

export default AuthScreen
