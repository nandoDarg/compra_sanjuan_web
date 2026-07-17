import { createClient } from '@/lib/supabase-client'
import type { OperationRole } from '@/lib/reputation-config'

export type OperationStatus = 'pending' | 'confirmed' | 'closed' | 'expired'

export type OperationRecord = {
  id: string
  post_id: string
  buyer_id: string
  seller_id: string
  status: OperationStatus
  buyer_confirmed: boolean | null
  seller_confirmed: boolean | null
  buyer_confirmed_at: string | null
  seller_confirmed_at: string | null
  created_at: string
  updated_at: string
}

export type OperationWithPost = OperationRecord & {
  post_title: string | null
  post_image_url: string | null
}

export type ProfileReputation = {
  user_id: string
  average_rating: number
  ratings_count: number
}

const OPERATION_SELECT_WITH_POST =
  'id,post_id,buyer_id,seller_id,status,buyer_confirmed,seller_confirmed,buyer_confirmed_at,seller_confirmed_at,created_at,updated_at,posts(title,image_url)'

type OperationRowWithPost = OperationRecord & {
  posts: { title: string; image_url: string | null } | null
}

function flattenOperationWithPost(row: OperationRowWithPost): OperationWithPost {
  const { posts, ...rest } = row
  return {
    ...rest,
    post_title: posts?.title ?? null,
    post_image_url: posts?.image_url ?? null,
  }
}

/** Determina si el usuario es comprador o vendedor de una operacion. */
export function getMyRole(operation: OperationRecord, userId: string): OperationRole {
  return operation.buyer_id === userId ? 'buyer_to_seller' : 'seller_to_buyer'
}

/** Confirmacion ya registrada por este usuario para esta operacion (null = sin responder). */
export function getMyConfirmation(operation: OperationRecord, userId: string): boolean | null {
  return operation.buyer_id === userId ? operation.buyer_confirmed : operation.seller_confirmed
}

/** id del otro participante de la operacion. */
export function getCounterpartyId(operation: OperationRecord, userId: string): string {
  return operation.buyer_id === userId ? operation.seller_id : operation.buyer_id
}

/**
 * Crea el registro de "posible operacion" al contactar por WhatsApp.
 * Idempotente (unique buyer_id+post_id): repetir el contacto no duplica filas.
 * No hace nada si el comprador es el propio vendedor (publicacion propia).
 */
export async function ensureOperationForContact(args: {
  postId: string
  buyerId: string
  sellerId: string
}): Promise<void> {
  if (args.buyerId === args.sellerId) {
    return
  }

  const supabase = createClient()
  const { error } = await supabase.from('operations').upsert(
    {
      post_id: args.postId,
      buyer_id: args.buyerId,
      seller_id: args.sellerId,
    },
    { onConflict: 'buyer_id,post_id', ignoreDuplicates: true }
  )

  if (error) {
    throw error
  }
}

/** Todas las operaciones (cualquier estado) donde el usuario es comprador o vendedor. */
export async function fetchMyOperations(userId: string): Promise<OperationWithPost[]> {
  const supabase = createClient()

  await supabase.rpc('expire_stale_operations')

  const { data, error } = await supabase
    .from('operations')
    .select(OPERATION_SELECT_WITH_POST)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as unknown as OperationRowWithPost[]).map(flattenOperationWithPost)
}

/** ids de operaciones que este usuario ya califico. */
export async function fetchMyRatedOperationIds(userId: string): Promise<Set<string>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('operation_ratings')
    .select('operation_id')
    .eq('rater_id', userId)

  if (error) {
    throw error
  }

  return new Set((data ?? []).map((row) => row.operation_id))
}

export async function confirmOperation(
  operationId: string,
  confirmed: boolean
): Promise<OperationRecord> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc('confirm_operation', {
    operation_id: operationId,
    confirmed,
  })

  if (error) {
    throw error
  }

  return data as OperationRecord
}

export async function submitOperationRating(args: {
  operationId: string
  raterId: string
  rateeId: string
  role: OperationRole
  overallRating: number
  aspectCommunication: number
  aspectTwo: number
  aspectThree: number
  comment?: string
}): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('operation_ratings').insert({
    operation_id: args.operationId,
    rater_id: args.raterId,
    ratee_id: args.rateeId,
    role: args.role,
    overall_rating: args.overallRating,
    aspect_communication: args.aspectCommunication,
    aspect_two: args.aspectTwo,
    aspect_three: args.aspectThree,
    comment: args.comment?.trim() || null,
  })

  if (error) {
    throw error
  }
}

export async function fetchProfileReputation(
  userIds: string[]
): Promise<Map<string, ProfileReputation>> {
  const uniqueIds = Array.from(new Set(userIds))

  if (uniqueIds.length === 0) {
    return new Map()
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_profile_reputation', {
    user_ids: uniqueIds,
  })

  if (error) {
    throw error
  }

  const map = new Map<string, ProfileReputation>()
  for (const row of (data ?? []) as ProfileReputation[]) {
    map.set(row.user_id, row)
  }
  return map
}
