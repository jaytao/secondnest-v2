import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// A session can be valid per Supabase Auth (auth.users intact) while the app's
// profiles row is missing — e.g. after a dev data reset, or if a profile is
// ever deleted independently of its account. Treat that as logged out, since
// the rest of the app assumes every session has a matching profile.
async function sessionHasProfile(session: Session): Promise<boolean> {
  const { data, error } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle()
  return !error && data !== null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyAndSet(nextSession: Session | null) {
      if (!nextSession) {
        setSession(null)
        return
      }
      if (await sessionHasProfile(nextSession)) {
        setSession(nextSession)
      } else {
        await supabase.auth.signOut()
        setSession(null)
      }
    }

    supabase.auth.getSession().then(async ({ data }) => {
      await verifyAndSet(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      // Defer: calling other supabase.auth methods (signOut) synchronously
      // inside this callback can deadlock the auth client.
      setTimeout(() => verifyAndSet(nextSession), 0)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
