'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import PostCard from '@/components/post-card'
import EmptyState from '@/components/ui/empty-state'
import PostDetailSkeleton from '@/components/ui/post-detail-skeleton'
import { createClient } from '@/lib/supabase-client'

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  image_url: string | null
  created_at: string
}

function formatLongDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const postId = params.id
  const supabase = useMemo(() => createClient(), [])

  const [post, setPost] = useState<Post | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,image_url,created_at')
        .eq('id', postId)
        .single()

      if (error || !data) {
        setPost(null)
        setErrorMsg('No pudimos encontrar esta publicacion.')
        setLoading(false)
        return
      }

      setPost(data)

      const { data: relatedData } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,image_url,created_at')
        .eq('category', data.category)
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(4)

      setRelatedPosts(relatedData ?? [])
      setLoading(false)
    }

    loadPost()
  }, [postId, supabase])

  const handleShare = async () => {
    if (!post) {
      return
    }

    const shareData = {
      title: post.title,
      text: `Mira esta publicacion: ${post.title}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        return
      }

      await navigator.clipboard.writeText(window.location.href)
      window.alert('Enlace copiado al portapapeles.')
    } catch {
      window.alert('No pudimos compartir esta publicacion en este momento.')
    }
  }

  const handleContact = () => {
    if (!post) {
      return
    }

    const subject = encodeURIComponent(`Consulta por ${post.title}`)
    const body = encodeURIComponent(
      `Hola, vi tu publicacion \"${post.title}\" en Compra San Juan y me interesa.`
    )

    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (loading) {
    return <PostDetailSkeleton />
  }

  if (!post) {
    return (
      <section className="py-8">
        <EmptyState
          title="Publicacion no disponible"
          description={
            errorMsg ?? 'Puede que el producto haya sido eliminado o que el enlace sea invalido.'
          }
          ctaHref="/"
          ctaLabel="Volver al feed"
        />
      </section>
    )
  }

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          ← Volver al feed
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              className="h-72 w-full object-cover sm:h-105 lg:h-130"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-slate-100 text-sm text-slate-500 sm:h-105 lg:h-130">
              Sin imagen disponible
            </div>
          )}
        </article>

        <aside className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {post.category}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            {post.title}
          </h1>

          <p className="mt-4 text-3xl font-extrabold tracking-tight text-emerald-700 sm:text-4xl">
            ${Number(post.price).toFixed(2)}
          </p>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-medium text-slate-700">Descripcion</p>
              <p className="mt-2 leading-6">{post.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Ubicacion</p>
                <p className="mt-1 font-medium text-slate-800">San Juan, AR</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Publicacion</p>
                <p className="mt-1 font-medium text-slate-800">{formatLongDate(post.created_at)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vendedor</p>
              <p className="mt-1 font-medium text-slate-800">Miembro #{post.user_id.slice(0, 8)}</p>
              <p className="mt-1 text-xs text-slate-500">Perfil activo en marketplace local.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleContact}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Contactar vendedor
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Compartir publicacion
            </button>
          </div>
        </aside>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Publicaciones similares</h2>
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Categoria: {post.category}
          </span>
        </div>

        {relatedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center text-sm text-slate-600">
            No hay publicaciones similares por ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {relatedPosts.map((relatedPost) => (
              <PostCard
                key={relatedPost.id}
                id={relatedPost.id}
                title={relatedPost.title}
                description={relatedPost.description}
                category={relatedPost.category}
                price={relatedPost.price}
                imageUrl={relatedPost.image_url}
                href={`/post/${relatedPost.id}`}
                publishedAt={relatedPost.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
