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
import {
  CATEGORY_TREE,
  getCategoryPathLabel,
  resolveCategorySelection,
} from '@/lib/hierarchical-categories'
import { isMissingSubcategoryColumnError } from '@/lib/post-subcategory-compat'
import { expandSearchQuery, buildSupabaseOrFilter } from '@/lib/search/expand-query'

type Post = {
  id: string
  title: string
  description: string
  price: number
  category: string
  subcategory: string | null
  tertiarySubcategory?: string | null
  condition: 'new' | 'used' | null
  location_department: string | null
  image_url: string | null
  created_at: string
}

type SortOption = 'recent' | 'price-asc' | 'price-desc'
type FallbackMode = 'none' | 'similar' | 'history'
type SearchHistoryRecord = { term: string; timestamp: string }
type InteractionHistoryRecord = {
  postId: string
  categoryPath: string
  timestamp: string
}
type CategoryStat = {
  name: string
  postCount: number
  subcategories: Array<{
    name: string
    postCount: number
  }>
}

const POSTS_SELECT_WITH_SUBCATEGORY =
  'id,title,description,price,category,subcategory,condition,location_department,image_url,created_at'

const POSTS_SELECT_LEGACY =
  'id,title,description,price,category,condition,location_department,image_url,created_at'

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
    (item) => typeof item?.postId === 'string' && typeof item?.categoryPath === 'string'
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
  interactionCategoryPaths: string[],
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

  const categoryPath = normalizeText(
    getCategoryPathLabel(post.category, post.subcategory, post.tertiarySubcategory)
  )

  const categoryAffinity = interactionCategoryPaths.reduce((acc, current) => {
    return normalizeText(current) === categoryPath ? acc + 1 : acc
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
  const selectedCategory = useMemo(
    () => searchParams.get('cat')?.trim() || 'Todas',
    [searchParams]
  )
  const selectedSubcategory = useMemo(
    () => searchParams.get('sub')?.trim() || 'Todas',
    [searchParams]
  )
  const [posts, setPosts] = useState<Post[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [loading, setLoading] = useState(true)
  const [feedError, setFeedError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('recent')
  const [fallbackMode, setFallbackMode] = useState<FallbackMode>('none')
  const [viewerId, setViewerId] = useState('guest')
  const [searchHistoryTerms, setSearchHistoryTerms] = useState<string[]>([])
  const [interactionCategoryPaths, setInteractionCategoryPaths] = useState<string[]>([])
  const [interactionPostIds, setInteractionPostIds] = useState<Set<string>>(new Set())
  const lastTrackedSearchQueryRef = useRef('')
  const loadRequestIdRef = useRef(0)

  const interactionCategoryPathFrequency = useMemo(() => {
    const frequency = new Map<string, number>()

    for (const categoryPath of interactionCategoryPaths) {
      const normalized = normalizeText(categoryPath)
      frequency.set(normalized, (frequency.get(normalized) ?? 0) + 1)
    }

    return frequency
  }, [interactionCategoryPaths])

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

  const updateCategoryFilters = useCallback(
    (category: string, subcategory: string = 'Todas') => {
      const params = new URLSearchParams(searchParams.toString())

      if (category === 'Todas') {
        params.delete('cat')
        params.delete('sub')
      } else {
        params.set('cat', category)

        if (subcategory !== 'Todas') {
          params.set('sub', subcategory)
        } else {
          params.delete('sub')
        }
      }

      const nextQueryString = params.toString()
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname)
    },
    [pathname, router, searchParams]
  )

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

  const selectedCondition = useMemo(() => {
    const val = searchParams.get('condition')
    return val === 'new' || val === 'used' ? val : null
  }, [searchParams])

  const selectedSubcategorySelection = useMemo(() => {
    if (selectedCategory === 'Todas' || selectedSubcategory === 'Todas') {
      return null
    }

    return resolveCategorySelection(selectedCategory, selectedSubcategory)
  }, [selectedCategory, selectedSubcategory])

  const updateCondition = useCallback(
    (nextValue: 'new' | 'used' | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextValue) {
        params.set('condition', nextValue)
      } else {
        params.delete('condition')
      }
      const nextQueryString = params.toString()
      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname)
    },
    [pathname, router, searchParams]
  )

  const handleCategoryChange = (category: string) => {
    updateCategoryFilters(category, 'Todas')
    trackEvent(ANALYTICS_EVENTS.CATEGORY_SELECTED, { category })
  }

  const handleSubcategoryChange = (category: string, subcategory: string) => {
    updateCategoryFilters(category, subcategory)
    trackEvent(ANALYTICS_EVENTS.CATEGORY_SELECTED, {
      category: `${category} > ${subcategory}`,
    })
  }

  const matchesSubcategoryFilter = useCallback(
    (post: Post) => {
      if (selectedSubcategory === 'Todas') {
        return true
      }

      if (!selectedSubcategorySelection?.subcategory) {
        return post.subcategory === selectedSubcategory
      }

      if (post.subcategory !== selectedSubcategorySelection.subcategory) {
        return false
      }

      if (!selectedSubcategorySelection.tertiarySubcategory) {
        return true
      }

      return post.tertiarySubcategory === selectedSubcategorySelection.tertiarySubcategory
    },
    [selectedSubcategory, selectedSubcategorySelection]
  )

  useEffect(() => {
    const bootstrapViewer = async () => {
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id ?? 'guest'
      setViewerId(userId)

      const searchHistory = readSearchHistory(userId)
      const interactions = readInteractionHistory(userId)

      setSearchHistoryTerms(searchHistory.map((item) => item.term))
      setInteractionCategoryPaths(interactions.map((item) => item.categoryPath))
      setInteractionPostIds(new Set(interactions.map((item) => item.postId)))
    }

    bootstrapViewer()
  }, [supabase])

  const registerPostInteraction = (post: Post) => {
    const existing = readInteractionHistory(viewerId).filter(
      (item) => item.postId !== post.id
    )
    const categoryPath = getCategoryPathLabel(post.category, post.subcategory, post.tertiarySubcategory)
    const updated = [
      { postId: post.id, categoryPath, timestamp: new Date().toISOString() },
      ...existing,
    ].slice(0, INTERACTIONS_MAX_ITEMS)

    writeInteractionHistory(viewerId, updated)
    setInteractionCategoryPaths(updated.map((item) => item.categoryPath))
    setInteractionPostIds(new Set(updated.map((item) => item.postId)))
  }

  useEffect(() => {
    const loadCategories = async () => {
      let { data, error } = await supabase
        .from('posts')
        .select('category,subcategory')
        .not('category', 'is', null)

      if (error && isMissingSubcategoryColumnError(error)) {
        const fallbackResult = await supabase
          .from('posts')
          .select('category')
          .not('category', 'is', null)

        error = fallbackResult.error
        data = (fallbackResult.data ?? []).map((row) => ({
          category: row.category,
          subcategory: null,
        }))
      }

      if (error || !data) {
        if (error) {
          setFeedError('No se pudo cargar el feed. Revisa permisos de lectura publica en Supabase.')
        }
        return
      }

      const rootCountByCategory = new Map<string, number>()
      const subcategoryCountByKey = new Map<string, number>()

      for (const item of data) {
        if (!item.category) {
          continue
        }

        const normalized = resolveCategorySelection(item.category, item.subcategory)
        rootCountByCategory.set(
          normalized.category,
          (rootCountByCategory.get(normalized.category) ?? 0) + 1
        )

        if (normalized.subcategory) {
          const subcategoryKey = `${normalized.category}::${normalized.subcategory}`
          subcategoryCountByKey.set(subcategoryKey, (subcategoryCountByKey.get(subcategoryKey) ?? 0) + 1)
        }
      }

      const sortedCategories = CATEGORY_TREE.map((root) => ({
        name: root.name,
        postCount: rootCountByCategory.get(root.name) ?? 0,
        interactionScore: interactionCategoryPathFrequency.get(normalizeText(root.name)) ?? 0,
        subcategories: (root.children ?? []).map((subcategory) => ({
          name: subcategory.name,
          postCount: subcategoryCountByKey.get(`${root.name}::${subcategory.name}`) ?? 0,
        })),
      }))
        .sort((left, right) => {
          if (right.interactionScore !== left.interactionScore) {
            return right.interactionScore - left.interactionScore
          }

          if (right.postCount !== left.postCount) {
            return right.postCount - left.postCount
          }

          return left.name.localeCompare(right.name)
        })

      const categoryTreeStats = sortedCategories.map((category) => ({
        name: category.name,
        postCount: category.postCount,
        subcategories: category.subcategories,
      }))

      setCategoryStats(categoryTreeStats)
    }

    loadCategories()
  }, [interactionCategoryPathFrequency, supabase])

  useEffect(() => {
    const loadPosts = async () => {
      const requestId = loadRequestIdRef.current + 1
      loadRequestIdRef.current = requestId

      setLoading(true)
      setFeedError(null)
      setFallbackMode('none')

      let query = supabase
        .from('posts')
        .select(POSTS_SELECT_WITH_SUBCATEGORY)

      if (searchQuery) {
        const expandedTerms = expandSearchQuery(searchQuery)
        query = query.or(buildSupabaseOrFilter(expandedTerms, true))
      }

      if (sortBy === 'price-asc') {
        query = query.order('price', { ascending: true })
      } else if (sortBy === 'price-desc') {
        query = query.order('price', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      if (selectedCondition) {
        query = query.eq('condition', selectedCondition)
      }

      let { data, error } = await query

      if (error && isMissingSubcategoryColumnError(error)) {
        let legacyQuery = supabase
          .from('posts')
          .select(POSTS_SELECT_LEGACY)

        if (searchQuery) {
          const expandedTerms = expandSearchQuery(searchQuery)
          legacyQuery = legacyQuery.or(buildSupabaseOrFilter(expandedTerms, false))
        }

        if (sortBy === 'price-asc') {
          legacyQuery = legacyQuery.order('price', { ascending: true })
        } else if (sortBy === 'price-desc') {
          legacyQuery = legacyQuery.order('price', { ascending: false })
        } else {
          legacyQuery = legacyQuery.order('created_at', { ascending: false })
        }

        if (selectedCondition) {
          legacyQuery = legacyQuery.eq('condition', selectedCondition)
        }

        const legacyResult = await legacyQuery
        error = legacyResult.error
        data = (legacyResult.data ?? []).map((post) => ({
          ...post,
          subcategory: null,
        }))
      }

      if (requestId !== loadRequestIdRef.current) {
        return
      }

      if (!error) {
        registerSearchTerm(searchQuery)
        const basePosts = (data ?? []).map((post) => ({
          ...post,
          ...resolveCategorySelection(post.category, post.subcategory),
        }))

        const postsForDisplay = basePosts.filter(
          (post) =>
            (selectedCategory === 'Todas' || post.category === selectedCategory) &&
            matchesSubcategoryFilter(post) &&
            (!selectedCondition || post.condition === selectedCondition)
        )

        const normalizedSearchQuery = normalizeText(searchQuery.trim())

        if (normalizedSearchQuery.length > 0) {
          if (lastTrackedSearchQueryRef.current !== normalizedSearchQuery) {
            trackEvent(ANALYTICS_EVENTS.SEARCH_PERFORMED, {
              query: searchQuery.trim(),
              results_count: postsForDisplay.length,
            })
            lastTrackedSearchQueryRef.current = normalizedSearchQuery
          }
        } else {
          lastTrackedSearchQueryRef.current = ''
        }

        if (postsForDisplay.length > 0) {
          setPosts(postsForDisplay)
        } else if (searchQuery || selectedCategory !== 'Todas' || selectedSubcategory !== 'Todas') {
          const fallbackBaseQuery = supabase
            .from('posts')
            .select(POSTS_SELECT_WITH_SUBCATEGORY)
            .order('created_at', { ascending: false })
            .limit(80)

          let { data: withCategoryData, error: fallbackError } = await fallbackBaseQuery

          if (fallbackError && isMissingSubcategoryColumnError(fallbackError)) {
            const fallbackLegacyQuery = supabase
              .from('posts')
              .select(POSTS_SELECT_LEGACY)
              .order('created_at', { ascending: false })
              .limit(80)

            const fallbackLegacyResult = await fallbackLegacyQuery
            fallbackError = fallbackLegacyResult.error
            withCategoryData = (fallbackLegacyResult.data ?? []).map((post) => ({
              ...post,
              subcategory: null,
            }))
          }

          if (fallbackError) {
            setPosts([])
            setFeedError('No se pudo cargar el feed. Revisa permisos de lectura publica en Supabase.')
            setLoading(false)
            return
          }

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          const fallbackCandidates = (withCategoryData ?? []).map((post) => ({
            ...post,
            ...resolveCategorySelection(post.category, post.subcategory),
          }))

          const filteredFallbackCandidates = fallbackCandidates.filter(
            (post) =>
              (selectedCategory === 'Todas' || post.category === selectedCategory) &&
              matchesSubcategoryFilter(post) &&
              (!selectedCondition || post.condition === selectedCondition)
          )

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          const normalizedQuery = normalizeText(searchQuery)
          const queryTokens = splitTokens(searchQuery)

          const rankedPosts = filteredFallbackCandidates
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
            const categoryFrequency = filteredFallbackCandidates.reduce((map, current) => {
              map.set(current.category, (map.get(current.category) ?? 0) + 1)
              return map
            }, new Map<string, number>())

            visibleFallbackPosts = filteredFallbackCandidates
              .map((post) => ({
                post,
                score: scoreByHistory(
                  post,
                  searchHistoryTerms,
                  interactionCategoryPaths,
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
    interactionCategoryPaths,
    interactionPostIds,
    registerSearchTerm,
    searchHistoryTerms,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedSubcategorySelection,
    selectedCondition,
    sortBy,
    supabase,
    matchesSubcategoryFilter,
  ])

  const hasFilters =
    searchQuery.length > 0 ||
    selectedCategory !== 'Todas' ||
    selectedSubcategory !== 'Todas' ||
    sortBy !== 'recent' ||
    selectedCondition !== null

  const fallbackCategorySuggestions = useMemo(
    () =>
      categoryStats
        .map((category) => category.name)
        .slice(0, SUGGESTION_LIMIT),
    [categoryStats]
  )

  const mobileCategories = categoryStats

  const desktopCategories = categoryStats

  const clearFilters = () => {
    setSortBy('recent')
    router.replace(pathname)
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-4 py-4 sm:gap-5 sm:py-5 lg:grid lg:grid-cols-[minmax(260px,max-content)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <div className="lg:order-1">
        <CategorySidebar
          categories={desktopCategories}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onSelectCategory={handleCategoryChange}
          onSelectSubcategory={handleSubcategoryChange}
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
            selectedSubcategory={selectedSubcategory}
            onChangeCategory={handleCategoryChange}
            onChangeSubcategory={handleSubcategoryChange}
            className="lg:hidden"
          />

          <div className="flex gap-2">
            {(['new', 'used'] as const).map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => updateCondition(selectedCondition === cond ? null : cond)}
                className={[
                  'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  selectedCondition === cond
                    ? cond === 'new'
                      ? 'border-(--success) bg-(--success) text-white shadow-sm'
                      : 'border-(--brand-secondary) bg-(--brand-secondary) text-white shadow-sm'
                    : 'thsj-chip hover:border-(--line-strong) hover:bg-(--background-elevated)',
                ].join(' ')}
              >
                {cond === 'new' ? 'Nuevo' : 'Usado'}
              </button>
            ))}
          </div>

          <ActiveFilterChips
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedSubcategory={selectedSubcategory}
            sortBy={sortBy}
            onRemoveSearch={() => updateSearchQuery('')}
            onRemoveCategory={() => handleCategoryChange('Todas')}
            onRemoveSubcategory={() => updateCategoryFilters(selectedCategory, 'Todas')}
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
              category={getCategoryPathLabel(post.category, post.subcategory, post.tertiarySubcategory)}
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
