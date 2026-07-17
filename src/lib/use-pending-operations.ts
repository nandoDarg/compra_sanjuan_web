'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import {
  fetchMyOperations,
  fetchMyRatedOperationIds,
  getMyConfirmation,
  type OperationWithPost,
} from '@/lib/operations'
import { CONFIRMATION_ASK_AFTER_DAYS } from '@/lib/reputation-config'

export type PendingOperationsState = {
  loading: boolean
  pendingConfirmations: OperationWithPost[]
  pendingRatings: OperationWithPost[]
  history: OperationWithPost[]
  pendingCount: number
  refetch: () => void
}

type OperationBuckets = {
  pendingConfirmations: OperationWithPost[]
  pendingRatings: OperationWithPost[]
  history: OperationWithPost[]
}

const ASK_AFTER_MS = CONFIRMATION_ASK_AFTER_DAYS * 24 * 60 * 60 * 1000
const EMPTY_BUCKETS: OperationBuckets = { pendingConfirmations: [], pendingRatings: [], history: [] }

function bucketOperations(
  operations: OperationWithPost[],
  ratedIds: Set<string>,
  userId: string,
  now: number
): OperationBuckets {
  const pendingConfirmations = operations.filter((op) => {
    if (op.status !== 'pending') {
      return false
    }

    if (getMyConfirmation(op, userId) !== null) {
      return false
    }

    return now - new Date(op.created_at).getTime() >= ASK_AFTER_MS
  })

  const pendingRatings = operations.filter(
    (op) => op.status === 'confirmed' && !ratedIds.has(op.id)
  )

  const history = operations.filter((op) => {
    if (op.status === 'closed' || op.status === 'expired') {
      return true
    }

    return op.status === 'confirmed' && ratedIds.has(op.id)
  })

  return { pendingConfirmations, pendingRatings, history }
}

/**
 * Fuente unica de "mis operaciones" para el navbar (solo necesita el conteo)
 * y la pagina /mis-operaciones (necesita las 3 listas completas), asi ninguno
 * de los dos duplica la consulta ni el criterio de bucketing.
 */
export function usePendingOperations(): PendingOperationsState {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [buckets, setBuckets] = useState<OperationBuckets>(EMPTY_BUCKETS)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!user) {
        if (active) {
          setBuckets(EMPTY_BUCKETS)
          setLoading(false)
        }
        return
      }

      if (active) {
        setLoading(true)
      }

      try {
        const [ops, rated] = await Promise.all([
          fetchMyOperations(user.id),
          fetchMyRatedOperationIds(user.id),
        ])

        if (!active) {
          return
        }

        setBuckets(bucketOperations(ops, rated, user.id, Date.now()))
      } catch {
        if (!active) {
          return
        }

        setBuckets(EMPTY_BUCKETS)
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [user, reloadToken])

  const refetch = useCallback(() => setReloadToken((token) => token + 1), [])

  return {
    loading,
    pendingConfirmations: buckets.pendingConfirmations,
    pendingRatings: buckets.pendingRatings,
    history: buckets.history,
    pendingCount: buckets.pendingConfirmations.length + buckets.pendingRatings.length,
    refetch,
  }
}
