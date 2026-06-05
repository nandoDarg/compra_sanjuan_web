'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import PostCard from '@/components/post-card'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import EmptyState from '@/components/ui/empty-state'
import CategoryFilter from '@/components/ui/category-filter'
import CategorySidebar from '@/components/ui/category-sidebar'
import ActiveFilterChips from '@/components/ui/active-filter-chips'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'

type Post = {
  id: string
  title: string
  description: string
  price: number
  category: string
  location_department: string | null
  image_url: string | null
  created_at: string
}

type SortOption = 'recent' | 'price-asc' | 'price-desc'
type FallbackMode = 'none' | 'similar' | 'history'
type SearchHistoryRecord = { term: string; timestamp: string }
type InteractionHistoryRecord = {
  postId: string
  category: string
  timestamp: string
}
type CategoryStat = {
  name: string
  postCount: number
  clickCount: number
}

const SUGGESTION_LIMIT = 5
const HISTORY_MAX_ITEMS = 12
const INTERACTIONS_MAX_ITEMS = 40
const SEARCH_HISTORY_STORAGE_KEY = 'thsj:search-history'
const INTERACTION_HISTORY_STORAGE_KEY = 'thsj:interaction-history'

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const splitTokens = (value: string) =>
  normalizeText(value)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)

const getStorageKey = (baseKey: string, viewerId: string) => `${baseKey}:${viewerId}`

const safeReadJson = <T,>(value: string | null): T | null => {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const readSearchHistory = (viewerId: string) => {
  if (typeof window === 'undefined') {
    return [] as SearchHistoryRecord[]
  }

  const raw = window.localStorage.getItem(
    getStorageKey(SEARCH_HISTORY_STORAGE_KEY, viewerId)
  )
  const parsed = safeReadJson<SearchHistoryRecord[]>(raw)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter((item) => typeof item?.term === 'string')
}

const writeSearchHistory = (viewerId: string, records: SearchHistoryRecord[]) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    getStorageKey(SEARCH_HISTORY_STORAGE_KEY, viewerId),
    JSON.stringify(records)
  )
}

const readInteractionHistory = (viewerId: string) => {
  if (typeof window === 'undefined') {
    return [] as InteractionHistoryRecord[]
  }

  const raw = window.localStorage.getItem(
    getStorageKey(INTERACTION_HISTORY_STORAGE_KEY, viewerId)
  )
  const parsed = safeReadJson<InteractionHistoryRecord[]>(raw)
  if (!Array.isArray(parsed)) {
    return []
  }

  return parsed.filter(
    (item) => typeof item?.postId === 'string' && typeof item?.category === 'string'
  )
}

const writeInteractionHistory = (
  viewerId: string,
  records: InteractionHistoryRecord[]
) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    getStorageKey(INTERACTION_HISTORY_STORAGE_KEY, viewerId),
    JSON.stringify(records)
  )
}

const scorePost = (post: Post, query: string, tokens: string[]) => {
  const title = normalizeText(post.title)
  const description = normalizeText(post.description)
  const category = normalizeText(post.category)

  let score = 0
  if (query && title.includes(query)) score += 8
  if (query && description.includes(query)) score += 4
  if (query && category.includes(query)) score += 5

  for (const token of tokens) {
    if (title.includes(token)) score += 3
    if (description.includes(token)) score += 1
    if (category.includes(token)) score += 2
  }

  return score
}

const scoreByHistory = (
  post: Post,
  searchHistoryTerms: string[],
  interactionCategories: string[],
  interactionsByPostId: Set<string>,
  categoryFrequency: Map<string, number>
) => {
  const title = normalizeText(post.title)
  const description = normalizeText(post.description)
  const category = normalizeText(post.category)
  let score = 0

  for (const term of searchHistoryTerms) {
    const normalizedTerm = normalizeText(term)
    if (normalizedTerm.length < 2) {
      continue
    }

    if (title.includes(normalizedTerm)) score += 3
    if (description.includes(normalizedTerm)) score += 1.5
    if (category.includes(normalizedTerm)) score += 2
  }

  const categoryAffinity = interactionCategories.reduce((acc, current) => {
    return normalizeText(current) === category ? acc + 1 : acc
  }, 0)
  score += Math.min(categoryAffinity * 2.5, 12)

  if (interactionsByPostId.has(post.id)) {
    score -= 2
  }

  score += (categoryFrequency.get(post.category) ?? 0) * 0.6

  const createdAt = new Date(post.created_at).getTime()
  if (!Number.isNaN(createdAt)) {
    const daysOld = Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60 * 24))
    score += Math.max(0, 6 - daysOld * 0.35)
  }

  return score
}

function HomeContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const searchQuery = useMemo(
    () => (searchParams.get('q') ?? '').trim(),
    [searchParams]
  )
  const [posts, setPosts] = useState<Post[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([
    { name: 'Todas', postCount: 0, clickCount: 0 },
  ])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>('none')
  const [viewerId, setViewerId] = useState('guest')
  const [searchHistoryTerms, setSearchHistoryTerms] = useState<string[]>([])
  const [interactionCategories, setInteractionCategories] = useState<string[]>([])
  const [interactionPostIds, setInteractionPostIds] = useState<Set<string>>(new Set())
  const lastTrackedSearchQueryRef = useRef('')
  const loadRequestIdRef = useRef(0)

  const interactionCategoryFrequency = useMemo(() => {
    const frequency = new Map<string, number>()

    for (const category of interactionCategories) {
      const normalized = normalizeText(category)
      frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1)
    }

    return frequency
  }, [interactionCategories])

  const registerSearchTerm = useCallback((term: string) => {
    const normalized = term.trim()
    if (normalized.length < 2) {
      return
    }

    const existingHistory = readSearchHistory(viewerId)
    if (
      existingHistory[0] &&
      normalizeText(existingHistory[0].term) === normalizeText(normalized)
    ) {
      return
    }

    const existing = existingHistory.filter(
      (item) => normalizeText(item.term) !== normalizeText(normalized)
    )
    const updated = [
      { term: normalized, timestamp: new Date().toISOString() },
      ...existing,
    ].slice(0, HISTORY_MAX_ITEMS)

    writeSearchHistory(viewerId, updated)
    setSearchHistoryTerms(updated.map((item) => item.term))
  }, [viewerId])

  const updateSearchQuery = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString())

      if (nextValue.trim()) {
        params.set('q', nextValue.trim())
      } else {
        params.delete('q')
      }

      const nextQueryString = params.toString()
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    trackEvent(ANALYTICS_EVENTS.CATEGORY_SELECTED, { category })
  }

  useEffect(() => {
    const bootstrapViewer = async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id ?? 'guest'
      setViewerId(userId)

      const searchHistory = readSearchHistory(userId)
      const interactions = readInteractionHistory(userId)

      setSearchHistoryTerms(searchHistory.map((item) => item.term))
      setInteractionCategories(interactions.map((item) => item.category))
      setInteractionPostIds(new Set(interactions.map((item) => item.postId)))
    }

    bootstrapViewer()
  }, [supabase])

  const registerPostInteraction = (post: Post) => {
    const existing = readInteractionHistory(viewerId).filter(
      (item) => item.postId !== post.id
    )
    const updated = [
      { postId: post.id, category: post.category, timestamp: new Date().toISOString() },
      ...existing,
    ].slice(0, INTERACTIONS_MAX_ITEMS)

    writeInteractionHistory(viewerId, updated)
    setInteractionCategories(updated.map((item) => item.category))
    setInteractionPostIds(new Set(updated.map((item) => item.postId)))
  }

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('category')
        .not('category', 'is', null)

      if (error || !data) {
        if (error) {
          setFeedError('No se pudo cargar el feed. Revisa permisos de lectura publica en Supabase.')
        }
        return
      }

      const postCountByCategory = data.reduce<Record<string, number>>((accumulator, item) => {
        const category = item.category?.trim()

        if (!category) {
          return accumulator
        }

        accumulator[category] = (accumulator[category] ?? 0) + 1
        return accumulator
      }, {})

      const sortedCategories = Object.entries(postCountByCategory)
        .map(([name, postCount]) => ({
          name,
          postCount,
          clickCount: interactionCategoryFrequency.get(normalizeText(name)) ?? 0,
        }))
        .sort((left, right) => {
          if (right.clickCount !== left.clickCount) {
            return right.clickCount - left.clickCount
          }

          if (right.postCount !== left.postCount) {
            return right.postCount - left.postCount
          }

          return left.name.localeCompare(right.name)
        })

      setCategoryStats([
        { name: 'Todas', postCount: data.length, clickCount: 0 },
        ...sortedCategories,
      ])
    }

    loadCategories()
  }, [interactionCategoryFrequency, supabase])

  useEffect(() => {
    const loadPosts = async () => {
      const requestId = loadRequestIdRef.current + 1
      loadRequestIdRef.current = requestId

      setLoading(true)
      setFeedError(null)
      setFallbackMode('none')

      let query = supabase
        .from('posts')
        .select('id,title,description,price,category,location_department,image_url,created_at')

      if (searchQuery) {
        const pattern = `%${searchQuery}%`
        query = query.or(
          `title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`
        )
      }

      if (selectedCategory !== 'Todas') {
        query = query.eq('category', selectedCategory)
      }

      if (sortBy === 'price-asc') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price-desc') {
        query = query.order('price', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (requestId !== loadRequestIdRef.current) {
        return
      }

      if (!error) {
        registerSearchTerm(searchQuery)
        const basePosts = data ?? []
        const normalizedSearchQuery = normalizeText(searchQuery.trim())

        if (normalizedSearchQuery.length > 0) {
          if (lastTrackedSearchQueryRef.current !== normalizedSearchQuery) {
            trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
              query: searchQuery.trim(),
              results_count: basePosts.length,
            })
            lastTrackedSearchQueryRef.current = normalizedSearchQuery
          }
        } else {
          lastTrackedSearchQueryRef.current = ''
        }

        if (basePosts.length > 0) {
          setPosts(basePosts)
        } else if (searchQuery || selectedCategory !== 'Todas') {
          const fallbackBaseQuery = supabase
            .from('posts')
            .select('id,title,description,price,category,location_department,image_url,created_at')
            .order('created_at', { ascending: false })
            .limit(80)

          const fallbackWithCategoryQuery =
            selectedCategory !== 'Todas'
              ? fallbackBaseQuery.eq('category', selectedCategory)
              : fallbackBaseQuery

          const { data: withCategoryData } = await fallbackWithCategoryQuery

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          const hasCategoryFallback = (withCategoryData?.length ?? 0) > 0

          const fallbackCandidates = hasCategoryFallback
            ? withCategoryData ?? []
            : (await supabase
                .from('posts')
              .select('id,title,description,price,category,location_department,image_url,created_at')
                .order('created_at', { ascending: false })
                .limit(80)).data ?? []

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          const normalizedQuery = normalizeText(searchQuery)
          const queryTokens = splitTokens(searchQuery)

          const rankedPosts = fallbackCandidates
            .map((post) => ({
              post,
              score: scorePost(post, normalizedQuery, queryTokens),
            }))
            .sort((a, b) => b.score - a.score)

          const similarPosts = rankedPosts
            .filter((item) => item.score > 0)
            .map((item) => item.post)

          let visibleFallbackPosts: Post[] = []
          let activeFallbackMode: FallbackMode = 'history'

          if (similarPosts.length > 0) {
            visibleFallbackPosts = similarPosts.slice(0, 24)
            activeFallbackMode = 'similar'
          } else {
            const categoryFrequency = fallbackCandidates.reduce((map, current) => {
              map.set(current.category, (map.get(current.category) ?? 0) + 1)
              return map
            }, new Map<string, number>())

            visibleFallbackPosts = fallbackCandidates
              .map((post) => ({
                post,
                score: scoreByHistory(
                  post,
                  searchHistoryTerms,
                  interactionCategories,
                  interactionPostIds,
                  categoryFrequency
                ),
              }))
              .sort((a, b) => b.score - a.score)
              .map((item) => item.post)
              .slice(0, 24)
          }

          setPosts(visibleFallbackPosts)
          setFallbackMode(visibleFallbackPosts.length > 0 ? activeFallbackMode : 'none')
        } else {
          setPosts([])
        }
      } else {
        setPosts([])
        setFeedError('No se pudo cargar el feed. Revisa permisos de lectura publica en Supabase.')
      }

      if (requestId === loadRequestIdRef.current) {
        setLoading(false)
      }
    }

    loadPosts()
  }, [
    interactionCategories,
    interactionPostIds,
    registerSearchTerm,
    searchHistoryTerms,
    searchQuery,
    selectedCategory,
    sortBy,
    supabase,
  ])

  const hasFilters =
    searchQuery.length > 0 || selectedCategory !== 'Todas' || sortBy !== 'recent'

  const fallbackCategorySuggestions = useMemo(
    () =>
      categoryStats
        .filter((category) => category.name !== 'Todas')
        .map((category) => category.name)
        .slice(0, SUGGESTION_LIMIT),
    [categoryStats]
  )

  const mobileCategories = useMemo(
    () => categoryStats.map((category) => category.name),
    [categoryStats]
  )

  const desktopCategories = useMemo(
    () => categoryStats.filter((category) => category.name !== 'Todas'),
    [categoryStats]
  )

  const clearFilters = () => {
    updateSearchQuery('')
    setSelectedCategory('Todas')
    setSortBy('recent')
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-4 py-4 sm:gap-5 sm:py-5 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="lg:order-1">
        <CategorySidebar
          categories={desktopCategories}
          selectedCategory={selectedCategory}
          onChange={handleCategoryChange}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-4 lg:order-2">
        <div className="thsj-panel p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_auto]">
          <label className="relative flex w-full">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className={[
                'thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm',
                sortBy === 'recent' ? 'text-(--foreground-muted)' : '',
              ].join(' ')}
            >
              <option value="recent">Ordenar por</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--foreground-muted)">
              ▾
            </span>
          </label>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="thsj-btn thsj-btn-ghost"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-col gap-3">
          <CategoryFilter
            categories={mobileCategories}
            selectedCategory={selectedCategory}
            onChange={handleCategoryChange}
            className="lg:hidden"
          />

          <ActiveFilterChips
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            sortBy={sortBy}
            onRemoveSearch={() => updateSearchQuery('')}
            onRemoveCategory={() => handleCategoryChange('Todas')}
            onRemoveSort={() => setSortBy('recent')}
          />
        </div>
      </div>

      {fallbackMode !== 'none' ? (
        <div className="thsj-panel p-4 sm:p-5">
          <p className="text-sm font-semibold text-foreground">
            No encontramos &quot;{searchQuery}&quot; — explorá esto que encontramos para vos:
          </p>
          {fallbackCategorySuggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {fallbackCategorySuggestions.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    updateSearchQuery('')
                    handleCategoryChange(category)
                  }}
                  className="thsj-chip"
                >
                  {category}
                </button>
              ))}
              <button
                type="button"
                onClick={() => updateSearchQuery('')}
                className="thsj-chip"
              >
                Ver todo
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {feedError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-(--danger)">
          {feedError}
        </p>
      ) : null}

      {loading ? (
        <FeedSkeleton items={8} />
      ) : posts.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No encontramos resultados' : 'Todavia no hay publicaciones'}
          description={
            hasFilters
              ? 'Prueba cambiando filtros o usando otra busqueda para encontrar mas productos.'
              : 'Publica tu primer producto para empezar a vender en el marketplace.'
          }
          ctaHref="/create-post"
          ctaLabel={hasFilters ? 'Crear una publicacion' : 'Crear publicacion'}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.description}
              category={post.category}
              locationDepartment={post.location_department}
              price={post.price}
              imageUrl={post.image_url}
              href={`/post/${post.id}`}
              publishedAt={post.created_at}
              onOpen={() => registerPostInteraction(post)}
            />
          ))}
        </div>
      )}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<FeedSkeleton items={8} />}>
      <HomeContent />
    </Suspense>
  )
}
