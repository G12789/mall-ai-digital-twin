import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../api/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/database'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const MOCK_USER: User = {
  id: 'dev-user-001',
  email: 'admin@mall.ai',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: '开发测试' },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User

const MOCK_PROFILE: Profile = {
  id: 'dev-user-001',
  tenant_id: 'dev-tenant-001',
  full_name: '开发测试',
  role: 'admin',
  avatar_url: null,
  phone: '13800138000',
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEV_MODE) {
      setUser(MOCK_USER)
      setProfile(MOCK_PROFILE)
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string) {
    if (DEV_MODE) {
      setUser(MOCK_USER)
      setProfile(MOCK_PROFILE)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, _fullName: string) {
    if (DEV_MODE) {
      setUser(MOCK_USER)
      setProfile(MOCK_PROFILE)
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (DEV_MODE) {
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
