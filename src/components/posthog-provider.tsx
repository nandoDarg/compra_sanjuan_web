'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

const INIT_GUARD_KEY = '__thsj_posthog_initialized__'

type PostHogClientProviderProps = {
  children: React.ReactNode
}

export default function PostHogClientProvider({ children }: PostHogClientProviderProps) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

  useEffect(() => {
    if (!posthogKey || typeof window === 'undefined') {
      return
    }

    const globalWindow = window as Window & { [INIT_GUARD_KEY]?: boolean }
    if (globalWindow[INIT_GUARD_KEY]) {
      return
    }

    posthog.init(posthogKey, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: 'identified_only',
      loaded: (client) => {
        if (process.env.NODE_ENV === 'development') {
          client.debug()
        }
      },
    })

    globalWindow[INIT_GUARD_KEY] = true
  }, [posthogHost, posthogKey])

  if (!posthogKey) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
