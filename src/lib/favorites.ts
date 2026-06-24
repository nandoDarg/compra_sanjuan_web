import { createClient } from '@/lib/supabase-client'

export type FavoritesMap = Record<string, true>

export function buildFavoritesMap(postIds: string[]) {
  return postIds.reduce<FavoritesMap>((acc, postId) => {
    acc[postId] = true
    return acc
  }, {})
}

export async function fetchFavoritePostIds(userId: string, postIds?: string[]) {
  const supabase = createClient()
  let query = supabase.from('favorites').select('post_id').eq('user_id', userId)

  if (postIds && postIds.length > 0) {
    query = query.in('post_id', postIds)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const ids = (data ?? [])
    .map((item) => item.post_id)
    .filter((value): value is string => typeof value === 'string' && value.length > 0)

  return ids
}

export async function toggleFavorite(args: {
  userId: string
  postId: string
  currentlyFavorite: boolean
}) {
  const supabase = createClient()

  if (args.currentlyFavorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', args.userId)
      .eq('post_id', args.postId)

    if (error) {
      throw error
    }

    return false
  }

  const { error } = await supabase.from('favorites').insert({
    user_id: args.userId,
    post_id: args.postId,
  })

  if (error) {
    throw error
  }

  return true
}
