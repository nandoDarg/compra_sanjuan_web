'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import PostCard from '@/components/post-card'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import EmptyState from '@/components/ui/empty-state'
import SearchBar from '@/components/ui/search-bar'
import CategoryFilter from '@/components/ui/category-filter'
import ActiveFilterChips from '@/components/ui/active-filter-chips'

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

const DEFAULT_CATEGORIES = ['Todas']

export default function Home() {
  const supabase = useMemo(() => createClient(), [])
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

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
        setPosts(data ?? [])
      }

      setLoading(false)
    }

    loadPosts()
  }, [searchQuery, selectedCategory, sortBy, supabase])

  const hasFilters =
    searchQuery.length > 0 || selectedCategory !== 'Todas' || sortBy !== 'recent'

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('Todas')
    setSortBy('recent')
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Marketplace
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Publicaciones disponibles
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Explora productos locales y encuentra oportunidades cerca tuyo.
            </p>
          </div>

          <Link
            href="/create-post"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Nueva publicacion
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:mt-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
            <SearchBar value={searchQuery} onDebouncedChange={setSearchQuery} />

            <label className="relative flex w-full">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
              >
                <option value="recent">Mas recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                ▾
              </span>
            </label>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onChange={setSelectedCategory}
            />

            <ActiveFilterChips
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              onRemoveSearch={() => setSearchQuery('')}
              onRemoveCategory={() => setSelectedCategory('Todas')}
              onRemoveSort={() => setSortBy('recent')}
            />
          </div>
        </div>
      </div>

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
              title={post.title}
              description={post.description}
              category={post.category}
              price={post.price}
              imageUrl={post.image_url}
            />
          ))}
        </div>
      )}
    </section>
  )
}
