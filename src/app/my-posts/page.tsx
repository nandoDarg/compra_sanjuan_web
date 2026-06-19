'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import PostCard from '@/components/post-card'
import { useAuth } from '@/components/auth-provider'
import FeedSkeleton from '@/components/ui/feed-skeleton'
import EmptyState from '@/components/ui/empty-state'
import { createClient } from '@/lib/supabase-client'
import { getCategoryPathLabel, resolveCategorySelection } from '@/lib/hierarchical-categories'
import { getPostImagePathFromPublicUrl } from '@/lib/post-images'
import { isMissingSubcategoryColumnError } from '@/lib/post-subcategory-compat'

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

export default function MyPostsPage() {
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    const loadMyPosts = async () => {
      setLoading(true)
      setErrorMsg(null)

      let { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,subcategory,image_url,created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error && isMissingSubcategoryColumnError(error)) {
        const fallbackResult = await supabase
          .from('posts')
          .select('id,user_id,title,description,price,category,image_url,created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        error = fallbackResult.error
        data = (fallbackResult.data ?? []).map((post) => ({
          ...post,
          subcategory: null,
        }))
      }

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      setPosts(
        (data ?? []).map((post) => ({
          ...post,
          ...resolveCategorySelection(post.category, post.subcategory),
        }))
      )
      setLoading(false)
    }

    loadMyPosts()
  }, [supabase, user])

  const handleDelete = async (post: Post) => {
    const confirmed = window.confirm('Esta accion eliminara la publicacion. Deseas continuar?')

    if (!confirmed || !user) {
      return
    }

    setDeletingPostId(post.id)
    setErrorMsg(null)

    const imagePath = getPostImagePathFromPublicUrl(post.image_url)

    if (imagePath) {
      await supabase.storage.from('post-images').remove([imagePath])
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
      .eq('user_id', user.id)

    if (error) {
      setErrorMsg(error.message)
      setDeletingPostId(null)
      return
    }

    setPosts((previous) => previous.filter((item) => item.id !== post.id))
    setDeletingPostId(null)
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="thsj-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
              Marketplace
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
              Mis publicaciones
            </h1>
            <p className="mt-2 text-sm">
              Edita o elimina tus productos publicados sin salir del panel.
            </p>
          </div>

          <Link
            href="/create-post"
            className="thsj-btn thsj-btn-primary"
          >
            Nueva publicacion
          </Link>
        </div>
      </div>

      {errorMsg ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-[var(--danger)]">
          {errorMsg}
        </p>
      ) : null}

      {loading ? (
        <FeedSkeleton items={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          title="Aun no publicaste productos"
          description="Cuando crees una publicacion, aparecera aqui para que puedas gestionarla facilmente."
          ctaHref="/create-post"
          ctaLabel="Crear publicacion"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => {
            const isDeleting = deletingPostId === post.id

            return (
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
                actions={
                  <>
                    <Link
                      href={`/my-posts/${post.id}/edit`}
                      className="thsj-btn thsj-btn-ghost inline-flex flex-1 px-3 py-2 text-sm"
                    >
                      Editar
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(post)}
                      disabled={isDeleting}
                      className="thsj-btn thsj-btn-danger inline-flex flex-1 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </>
                }
              />
            )
          })}
        </div>
      )}
    </section>
  )
}
