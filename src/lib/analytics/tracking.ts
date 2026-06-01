'use client'

import posthog from 'posthog-js'

export const ANALYTICS_EVENTS = {
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  POST_CREATED: 'post_created',
  POST_VIEWED: 'post_viewed',
  WHATSAPP_CLICKED: 'whatsapp_clicked',
  POST_SHARED: 'post_shared',
  SEARCH_PERFORMED: 'search_performed',
  CATEGORY_SELECTED: 'category_selected',
} as const

type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

type AnalyticsEventPayloadMap = {
  [ANALYTICS_EVENTS.USER_REGISTERED]: {
    method: string
    timestamp: string
  }
  [ANALYTICS_EVENTS.USER_LOGGED_IN]: {
    method: string
    timestamp: string
  }
  [ANALYTICS_EVENTS.POST_CREATED]: {
    category: string
    price: number
    has_image: boolean
  }
  [ANALYTICS_EVENTS.POST_VIEWED]: {
    post_id: string
    category: string
  }
  [ANALYTICS_EVENTS.WHATSAPP_CLICKED]: {
    post_id: string
    category: string
  }
  [ANALYTICS_EVENTS.POST_SHARED]: {
    post_id: string
    category: string
    share_method: string
  }
  [ANALYTICS_EVENTS.SEARCH_PERFORMED]: {
    query: string
    results_count: number
  }
  [ANALYTICS_EVENTS.CATEGORY_SELECTED]: {
    category: string
  }
}

function canUseAnalytics() {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY)
}

export function trackEvent<TEventName extends AnalyticsEventName>(
  eventName: TEventName,
  payload: AnalyticsEventPayloadMap[TEventName]
) {
  if (!canUseAnalytics()) {
    return
  }

  posthog.capture(eventName, payload)
}

export function identifyAnalyticsUser(userId: string, userEmail?: string | null) {
  if (!canUseAnalytics()) {
    return
  }

  const properties = userEmail ? { email: userEmail } : undefined
  posthog.identify(userId, properties)
}

export function resetAnalyticsUser() {
  if (!canUseAnalytics()) {
    return
  }

  posthog.reset()
}
