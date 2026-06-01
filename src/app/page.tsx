'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import PostCard from '@/components/post-card'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import EmptyState from '@/components/ui/empty-state'
import SearchBar from '@/components/ui/search-bar'
import CategoryFilter from '@/components/ui/category-filter'
import ActiveFilterChips from '@/components/ui/active-filter-chips'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'

type Post = {
  id: string
  title: string
  description: string
  price: number
  category: string
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

const DEFAULT_CATEGORIES = ['Todas']
const SUGGESTION_LIMIT = 5
const HISTORY_MAX_ITEMS = 12
const INTERACTIONS_MAX_ITEMS = 40
const SEARCH_HISTORY_STORAGE_KEY = 'thsj:search-history'
const INTERACTION_HISTORY_STORAGE_KEY = 'thsj:interaction-history'

const STOP_WORDS = new Set([
  'de',
  'la',
  'el',
  'y',
  'en',
  'con',
  'para',
  'por',
  'sin',
  'una',
  'uno',
  'un',
  'los',
  'las',
])

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

const buildSuggestions = (
  query: string,
  fallbackPosts: Post[],
  selectedCategory: string,
  searchHistoryTerms: string[]
) => {
  const currentTokens = new Set(splitTokens(query))
  const terms: string[] = []

  for (const post of fallbackPosts) {
    terms.push(post.category)

    const titleTokens = splitTokens(post.title).filter(
      (token) => token.length >= 3 && !STOP_WORDS.has(token)
    )
    terms.push(...titleTokens)
  }

  if (selectedCategory !== 'Todas') {
    terms.push(selectedCategory)
  }

  terms.push(...searchHistoryTerms)

  const unique = Array.from(
    new Set(
      terms
        .map((term) => term.trim())
        .filter((term) => term.length > 0)
        .filter((term) => !currentTokens.has(normalizeText(term)))
    )
  )

  return unique.slice(0, SUGGESTION_LIMIT)
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

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>('none')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [viewerId, setViewerId] = useState('guest')
  const [searchHistoryTerms, setSearchHistoryTerms] = useState<string[]>([])
  const [interactionCategories, setInteractionCategories] = useState<string[]>([])
  const [interactionPostIds, setInteractionPostIds] = useState<Set<string>>(new Set())
  const lastTrackedSearchQueryRef = useRef('')

  const registerSearchTerm = (term: string) => {
    const normalized = term.trim()
    if (normalized.length < 2) {
      return
    }

    const existing = readSearchHistory(viewerId).filter(
      (item) => normalizeText(item.term) !== normalizeText(normalized)
    )
    const updated = [
      { term: normalized, timestamp: new Date().toISOString() },
      ...existing,
    ].slice(0, HISTORY_MAX_ITEMS)

    writeSearchHistory(viewerId, updated)
    setSearchHistoryTerms(updated.map((item) => item.term))
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    registerSearchTerm(value)
  }

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
        return
      }

      const dynamicCategories = Array.from(
        new Set(
          data
            .map((item) => item.category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      ).sort((a, b) => a.localeCompare(b))

      setCategories(['Todas', ...dynamicCategories])
    }

    loadCategories()
  }, [supabase])

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true)
      setFallbackMode('none')
      setSuggestions([])

      let query = supabase
        .from('posts')
        .select('id,title,description,price,category,image_url,created_at')

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

      if (!error) {
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
            .select('id,title,description,price,category,image_url,created_at')
            .order('created_at', { ascending: false })
            .limit(80)

          const fallbackWithCategoryQuery =
            selectedCategory !== 'Todas'
              ? fallbackBaseQuery.eq('category', selectedCategory)
              : fallbackBaseQuery

          const { data: withCategoryData } = await fallbackWithCategoryQuery

          const hasCategoryFallback = (withCategoryData?.length ?? 0) > 0

          const fallbackCandidates = hasCategoryFallback
            ? withCategoryData ?? []
            : (await supabase
                .from('posts')
                .select('id,title,description,price,category,image_url,created_at')
                .order('created_at', { ascending: false })
                .limit(80)).data ?? []

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
          setSuggestions(
            buildSuggestions(
              searchQuery,
              visibleFallbackPosts,
              selectedCategory,
              searchHistoryTerms
            )
          )
        } else {
          setPosts([])
        }
      }

      setLoading(false)
    }

    loadPosts()
  }, [
    interactionCategories,
    interactionPostIds,
    searchHistoryTerms,
    searchQuery,
    selectedCategory,
    sortBy,
    supabase,
  ])

  const hasFilters =
    searchQuery.length > 0 || selectedCategory !== 'Todas' || sortBy !== 'recent'

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('Todas')
    setSortBy('recent')
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="thsj-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
              Marketplace
            </p>
            <h1 className="mt-1 font-bold text-foreground">
              Publicaciones disponibles
            </h1>
            <p className="mt-2 text-sm">
              Explora productos locales y encuentra oportunidades cerca tuyo.
            </p>
          </div>

          <Link
            href="/create-post"
            className="thsj-btn thsj-btn-primary"
          >
            Nueva publicacion
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:mt-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <SearchBar value={searchQuery} onDebouncedChange={handleSearchChange} />

            <label className="relative flex w-full">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm"
              >
                <option value="recent">Mas recientes</option>
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

          <div className="flex flex-col gap-3">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onChange={handleCategoryChange}
            />

            <ActiveFilterChips
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              onRemoveSearch={() => setSearchQuery('')}
              onRemoveCategory={() => handleCategoryChange('Todas')}
              onRemoveSort={() => setSortBy('recent')}
            />
          </div>
        </div>
      </div>

      {fallbackMode !== 'none' ? (
        <div className="thsj-panel p-4 sm:p-5">
          <p className="text-sm font-semibold text-foreground">
            Dale una mirada a esto que encontramos para vos
          </p>
          {fallbackMode === 'history' ? (
            <p className="mt-1 text-sm text-(--foreground-muted)">
              Priorizamos lo que mas se parece a tus intereses segun tu historial y navegacion.
            </p>
          ) : null}
          {suggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestions.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setSearchQuery(term)}
                  className="thsj-chip"
                >
                  Probar: {term}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              description={post.description}
              category={post.category}
              price={post.price}
              imageUrl={post.image_url}
              href={`/post/${post.id}`}
              publishedAt={post.created_at}
              onOpen={() => registerPostInteraction(post)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
