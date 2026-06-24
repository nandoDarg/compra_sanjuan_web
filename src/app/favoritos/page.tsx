'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/post-card'
import { useAuth } from '@/components/auth-provider'
import EmptyState from '@/components/ui/empty-state'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import { createClient } from '@/lib/supabase-client'
import { getCategoryPathLabel, resolveCategorySelection } from '@/lib/hierarchical-categories'

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  subcategory: string | null
  tertiarySubcategory?: string | null
  image_url: string | null
  created_at: string
}

type FavoriteWithPostRow = {
  created_at: string
  post: {
    id: string
    user_id: string
    title: string
    description: string
    price: number
    category: string
    subcategory: string | null
    image_url: string | null
    created_at: string
  } | null
}

export default function FavoritosPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { user, loading } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [loading, router, user])

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const loadFavorites = async () => {
      setIsLoading(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from('favorites')
        .select(
          'created_at, post:posts(id,user_id,title,description,price,category,subcategory,image_url,created_at)'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMsg(error.message)
        setIsLoading(false)
        return
      }

      const normalizedPosts = ((data ?? []) as FavoriteWithPostRow[])
        .map((item) => item.post)
        .filter((post): post is FavoriteWithPostRow['post'] & { id: string } => Boolean(post?.id))
        .map((post) => ({
          ...post,
          ...resolveCategorySelection(post.category, post.subcategory),
        }))

      setPosts(normalizedPosts)
      setIsLoading(false)
    }

    void loadFavorites()
  }, [supabase, user])

  if (loading || isLoading) {
    return <FeedSkeleton items={8} />
  }

  if (!user) {
    return null
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="thsj-panel p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Favoritos</h1>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Tus publicaciones guardadas para revisarlas cuando quieras.
        </p>
      </div>

      {errorMsg ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-(--danger)">
          {errorMsg}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <EmptyState
          title="Todavía no guardaste ningún aviso"
          description="¡Explorá el feed y guardá los que te interesen!"
          ctaHref="/"
          ctaLabel="Explorar el feed"
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
              price={post.price}
              imageUrl={post.image_url}
              href={`/post/${post.id}`}
              publishedAt={post.created_at}
            />
          ))}
        </div>
      )}
    </section>
  )
}
