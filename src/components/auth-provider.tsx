'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-client'
import { identifyAnalyticsUser, resetAnalyticsUser } from '@/lib/analytics/tracking'

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = useMemo(() => createClient(), [])

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadingTimeoutId = window.setTimeout(() => {
      if (!isMounted) {
        return
      }

      // Avoid indefinite UI freeze if auth endpoint hangs on constrained mobile networks.
      setLoading(false)
    }, 8000)

    const bootstrapAuth = async () => {
      try {
        const { data } = await supabase.auth.getUser()

        if (!isMounted) {
          return
        }

        setUser(data.user)
        if (data.user) {
          identifyAnalyticsUser(data.user.id, data.user.email)
        } else {
          resetAnalyticsUser()
        }
      } catch (error) {
        console.error(error)
        try {
          console.error(JSON.stringify(error, null, 2))
        } catch {
          console.error('No se pudo serializar el error de auth bootstrap.')
        }

        if (isMounted) {
          setUser(null)
          resetAnalyticsUser()
        }
      } finally {
        if (isMounted) {
          window.clearTimeout(loadingTimeoutId)
          setLoading(false)
        }
      }
    }

    void bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return
      }

      setUser(session?.user ?? null)
      if (session?.user) {
        identifyAnalyticsUser(session.user.id, session.user.email)
      } else {
        resetAnalyticsUser()
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      window.clearTimeout(loadingTimeoutId)
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
