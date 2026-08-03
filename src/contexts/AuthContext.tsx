import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', userId)
      .maybeSingle()
    if (error) return
    if (data) {
      setProfile(data as Profile)
      return
    }
    // Fallback: create the profile row from auth metadata on first login.
    const { data: userRes } = await supabase.auth.getUser()
    const u = userRes?.user
    if (!u) return
    const row = {
      id: u.id,
      full_name: (u.user_metadata?.full_name as string) ?? null,
      email: u.email ?? (u.user_metadata?.email as string) ?? null,
      phone: u.phone ?? (u.user_metadata?.phone as string) ?? null,
    }
    const { data: inserted } = await supabase
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select('id, full_name, email, phone')
      .maybeSingle()
    setProfile((inserted as Profile) ?? (row as Profile))
  }, [])


  useEffect(() => {
    // 1) Register the listener first so no event is missed.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        // Defer the Supabase call out of the callback to avoid deadlocks.
        setTimeout(() => loadProfile(newSession.user.id), 0)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    // 2) Then pick up any persisted session.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session?.user) loadProfile(data.session.user.id)
      setLoading(false)
    })

    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id)
  }, [session, loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
