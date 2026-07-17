'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import EmptyState from '@/components/ui/empty-state'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import OperationCard from '@/components/ui/operation-card'
import StarRating from '@/components/ui/star-rating'
import { createClient } from '@/lib/supabase-client'
import { usePendingOperations } from '@/lib/use-pending-operations'
import {
  confirmOperation,
  getCounterpartyId,
  getMyRole,
  submitOperationRating,
  type OperationWithPost,
} from '@/lib/operations'
import { RATING_ASPECT_LABELS } from '@/lib/reputation-config'

type ProfileNameMap = Map<string, string>

async function fetchDisplayNames(userIds: string[]): Promise<ProfileNameMap> {
  const uniqueIds = Array.from(new Set(userIds))
  const map: ProfileNameMap = new Map()

  if (uniqueIds.length === 0) {
    return map
  }

  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('user_id,display_name,full_name')
    .in('user_id', uniqueIds)

  for (const row of data ?? []) {
    map.set(row.user_id, row.full_name?.trim() || row.display_name?.trim() || 'Usuario')
  }

  return map
}

type RatingFormState = {
  operationId: string
  overall: number
  communication: number
  two: number
  three: number
  comment: string
  submitting: boolean
  error: string | null
}

export default function MisOperacionesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { loading: operationsLoading, pendingConfirmations, pendingRatings, history, refetch } =
    usePendingOperations()

  const [names, setNames] = useState<ProfileNameMap>(new Map())
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [ratingForm, setRatingForm] = useState<RatingFormState | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login')
    }
  }, [authLoading, router, user])

  const allOperations = useMemo(
    () => [...pendingConfirmations, ...pendingRatings, ...history],
    [pendingConfirmations, pendingRatings, history]
  )

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!user || allOperations.length === 0) {
        if (active) {
          setNames(new Map())
        }
        return
      }

      const counterpartyIds = allOperations.map((op) => getCounterpartyId(op, user.id))
      const map = await fetchDisplayNames(counterpartyIds)

      if (active) {
        setNames(map)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [allOperations, user])

  if (authLoading || operationsLoading) {
    return <FeedSkeleton items={4} />
  }

  if (!user) {
    return null
  }

  const handleConfirm = async (operation: OperationWithPost, confirmed: boolean) => {
    setConfirmError(null)
    setConfirmingId(operation.id)

    try {
      await confirmOperation(operation.id, confirmed)
      refetch()
    } catch {
      setConfirmError('No se pudo registrar tu respuesta. Intenta de nuevo.')
    } finally {
      setConfirmingId(null)
    }
  }

  const openRatingForm = (operationId: string) => {
    setRatingForm({
      operationId,
      overall: 0,
      communication: 0,
      two: 0,
      three: 0,
      comment: '',
      submitting: false,
      error: null,
    })
  }

  const submitRating = async (operation: OperationWithPost) => {
    if (!ratingForm || ratingForm.operationId !== operation.id) {
      return
    }

    if (
      ratingForm.overall === 0 ||
      ratingForm.communication === 0 ||
      ratingForm.two === 0 ||
      ratingForm.three === 0
    ) {
      setRatingForm({ ...ratingForm, error: 'Completa las 4 calificaciones (son obligatorias).' })
      return
    }

    setRatingForm({ ...ratingForm, submitting: true, error: null })

    try {
      await submitOperationRating({
        operationId: operation.id,
        raterId: user.id,
        rateeId: getCounterpartyId(operation, user.id),
        role: getMyRole(operation, user.id),
        overallRating: ratingForm.overall,
        aspectCommunication: ratingForm.communication,
        aspectTwo: ratingForm.two,
        aspectThree: ratingForm.three,
        comment: ratingForm.comment,
      })
      setRatingForm(null)
      refetch()
    } catch {
      setRatingForm({ ...ratingForm, submitting: false, error: 'No se pudo enviar la calificacion.' })
    }
  }

  const totalPending = pendingConfirmations.length + pendingRatings.length

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="thsj-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Mis operaciones</h1>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Confirma tus operaciones y calificalas para construir tu reputacion como comprador o vendedor.
        </p>
      </div>

      {confirmError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-(--danger)">
          {confirmError}
        </p>
      ) : null}

      {totalPending === 0 && history.length === 0 ? (
        <EmptyState
          title="Todavia no tenes operaciones"
          description="Cuando contactes a un vendedor (o alguien te contacte) por WhatsApp, la operacion va a aparecer aca."
          ctaHref="/"
          ctaLabel="Explorar el feed"
        />
      ) : null}

      {pendingConfirmations.length > 0 ? (
        <div className="thsj-panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Para confirmar</h2>
          <div className="mt-3 flex flex-col gap-3">
            {pendingConfirmations.map((operation) => {
              const role = getMyRole(operation, user.id)
              const labels = RATING_ASPECT_LABELS[role]
              const counterpartyId = getCounterpartyId(operation, user.id)

              return (
                <OperationCard
                  key={operation.id}
                  postTitle={operation.post_title ?? 'Publicacion'}
                  postImageUrl={operation.post_image_url}
                  counterpartyName={names.get(counterpartyId) ?? 'Usuario'}
                  counterpartyRoleLabel={role === 'buyer_to_seller' ? 'Vendedor' : 'Comprador'}
                  statusLabel="Pendiente de confirmar"
                  statusTone="warning"
                >
                  <p className="text-sm text-foreground">{labels.question}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleConfirm(operation, true)}
                      disabled={confirmingId === operation.id}
                      className="thsj-btn thsj-btn-primary px-4 py-1.5 text-sm disabled:opacity-60"
                    >
                      Si
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirm(operation, false)}
                      disabled={confirmingId === operation.id}
                      className="thsj-btn thsj-btn-ghost px-4 py-1.5 text-sm disabled:opacity-60"
                    >
                      No
                    </button>
                  </div>
                </OperationCard>
              )
            })}
          </div>
        </div>
      ) : null}

      {pendingRatings.length > 0 ? (
        <div className="thsj-panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Para calificar</h2>
          <div className="mt-3 flex flex-col gap-3">
            {pendingRatings.map((operation) => {
              const role = getMyRole(operation, user.id)
              const labels = RATING_ASPECT_LABELS[role]
              const counterpartyId = getCounterpartyId(operation, user.id)
              const isEditingThis = ratingForm?.operationId === operation.id

              return (
                <OperationCard
                  key={operation.id}
                  postTitle={operation.post_title ?? 'Publicacion'}
                  postImageUrl={operation.post_image_url}
                  counterpartyName={names.get(counterpartyId) ?? 'Usuario'}
                  counterpartyRoleLabel={role === 'buyer_to_seller' ? 'Vendedor' : 'Comprador'}
                  statusLabel="Operacion confirmada"
                  statusTone="success"
                >
                  {!isEditingThis ? (
                    <button
                      type="button"
                      onClick={() => openRatingForm(operation.id)}
                      className="thsj-btn thsj-btn-primary px-4 py-1.5 text-sm"
                    >
                      Calificar
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 rounded-xl border border-(--line) bg-(--background-muted) p-3">
                      <div>
                        <p className="mb-1 text-xs font-medium text-(--foreground-muted)">{labels.overall}</p>
                        <StarRating
                          value={ratingForm.overall}
                          onChange={(v) => setRatingForm({ ...ratingForm, overall: v })}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-(--foreground-muted)">{labels.communication}</p>
                        <StarRating
                          value={ratingForm.communication}
                          onChange={(v) => setRatingForm({ ...ratingForm, communication: v })}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-(--foreground-muted)">{labels.two}</p>
                        <StarRating
                          value={ratingForm.two}
                          onChange={(v) => setRatingForm({ ...ratingForm, two: v })}
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-medium text-(--foreground-muted)">{labels.three}</p>
                        <StarRating
                          value={ratingForm.three}
                          onChange={(v) => setRatingForm({ ...ratingForm, three: v })}
                        />
                      </div>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-(--foreground-muted)">{labels.comment}</span>
                        <textarea
                          value={ratingForm.comment}
                          onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                          rows={2}
                          className="thsj-input px-3 py-2 text-sm"
                        />
                      </label>

                      {ratingForm.error ? (
                        <p className="text-xs font-medium text-(--danger)">{ratingForm.error}</p>
                      ) : null}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void submitRating(operation)}
                          disabled={ratingForm.submitting}
                          className="thsj-btn thsj-btn-primary px-4 py-1.5 text-sm disabled:opacity-60"
                        >
                          {ratingForm.submitting ? 'Enviando...' : 'Enviar calificacion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRatingForm(null)}
                          disabled={ratingForm.submitting}
                          className="thsj-btn thsj-btn-ghost px-4 py-1.5 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </OperationCard>
              )
            })}
          </div>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="thsj-panel p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Historial</h2>
          <div className="mt-3 flex flex-col gap-3">
            {history.map((operation) => {
              const role = getMyRole(operation, user.id)
              const counterpartyId = getCounterpartyId(operation, user.id)
              const statusLabel =
                operation.status === 'closed'
                  ? 'No concretada'
                  : operation.status === 'expired'
                    ? 'Expirada'
                    : 'Calificada'

              return (
                <OperationCard
                  key={operation.id}
                  postTitle={operation.post_title ?? 'Publicacion'}
                  postImageUrl={operation.post_image_url}
                  counterpartyName={names.get(counterpartyId) ?? 'Usuario'}
                  counterpartyRoleLabel={role === 'buyer_to_seller' ? 'Vendedor' : 'Comprador'}
                  statusLabel={statusLabel}
                  statusTone={operation.status === 'closed' ? 'danger' : 'neutral'}
                />
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
