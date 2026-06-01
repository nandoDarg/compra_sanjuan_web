'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import PostCard from '@/components/post-card'
import EmptyState from '@/components/ui/empty-state'
import PostDetailSkeleton from '@/components/ui/post-detail-skeleton'
import { createClient } from '@/lib/supabase-client'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  whatsapp_number: string | null
  image_url: string | null
  created_at: string
}

function sanitizeWhatsAppNumber(value: string | null) {
  if (!value) {
    return ''
  }

  return value.replace(/\D+/g, '')
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
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const trackedPostViewIdRef = useRef<string | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,whatsapp_number,image_url,created_at')
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
        .select('id,user_id,title,description,price,category,whatsapp_number,image_url,created_at')
        .eq('category', data.category)
        .neq('id', data.id)
        .order('created_at', { ascending: false })
        .limit(4)

      setRelatedPosts(relatedData ?? [])
      setLoading(false)
    }

    loadPost()
  }, [postId, supabase])

  useEffect(() => {
    if (!post || trackedPostViewIdRef.current === post.id) {
      return
    }

    trackEvent(ANALYTICS_EVENTS.POST_VIEWED, {
      post_id: post.id,
      category: post.category,
    })
    trackedPostViewIdRef.current = post.id
  }, [post])

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
        trackEvent(ANALYTICS_EVENTS.POST_SHARED, {
          post_id: post.id,
          category: post.category,
          share_method: 'native_share',
        })
        setShareFeedback('Publicacion compartida')
        setTimeout(() => setShareFeedback(null), 2000)
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href)
        trackEvent(ANALYTICS_EVENTS.POST_SHARED, {
          post_id: post.id,
          category: post.category,
          share_method: 'clipboard',
        })
        setShareFeedback('Enlace copiado')
        setTimeout(() => setShareFeedback(null), 2000)
        return
      }

      trackEvent(ANALYTICS_EVENTS.POST_SHARED, {
        post_id: post.id,
        category: post.category,
        share_method: 'not_supported',
      })
      setShareFeedback('No se pudo compartir')
      setTimeout(() => setShareFeedback(null), 2000)
    } catch {
      trackEvent(ANALYTICS_EVENTS.POST_SHARED, {
        post_id: post.id,
        category: post.category,
        share_method: 'error',
      })
      setShareFeedback('No se pudo compartir')
      setTimeout(() => setShareFeedback(null), 2000)
    }
  }

  const handleContact = () => {
    if (!post) {
      return
    }

    const number = sanitizeWhatsAppNumber(post.whatsapp_number)

    if (!number) {
      return
    }

    trackEvent(ANALYTICS_EVENTS.WHATSAPP_CLICKED, {
      post_id: post.id,
      category: post.category,
    })

    const message = encodeURIComponent('Hola, te contacto por tu publicacion en tratohechoSJ')
    window.open(`https://wa.me/${number}?text=${message}`, '_blank', 'noopener,noreferrer')
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

  const hasWhatsAppContact = Boolean(sanitizeWhatsAppNumber(post.whatsapp_number))

  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div>
        <Link
          href="/"
          className="thsj-btn thsj-btn-ghost inline-flex items-center gap-2 px-4 py-2 text-sm"
        >
          ← Volver al feed
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <article className="thsj-card overflow-hidden">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt={post.title}
              className="h-72 w-full object-cover sm:h-105 lg:h-130"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-(--background-muted) text-sm text-(--foreground-muted) sm:h-105 lg:h-130">
              Sin imagen disponible
            </div>
          )}
        </article>

        <aside className="thsj-panel p-5 sm:p-6">
          <div className="thsj-chip inline-flex items-center px-3 py-1 text-xs font-medium">
            {post.category}
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {post.title}
          </h1>

          <p className="mt-4 text-3xl font-extrabold tracking-tight text-(--brand-primary) sm:text-4xl">
            ${Number(post.price).toFixed(2)}
          </p>

          <div className="mt-6 space-y-4 text-sm text-(--foreground-muted)">
            <div className="rounded-2xl border border-(--line) bg-(--background-muted) p-4">
              <p className="font-medium text-foreground">Descripcion</p>
              <p className="mt-2 leading-6">{post.description}</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
                <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Ubicacion</p>
                <p className="mt-1 font-medium text-foreground">San Juan, AR</p>
              </div>
              <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
                <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Publicacion</p>
                <p className="mt-1 font-medium text-foreground">{formatLongDate(post.created_at)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
              <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Vendedor</p>
              <p className="mt-1 font-medium text-foreground">Miembro #{post.user_id.slice(0, 8)}</p>
              <p className="mt-1 text-xs text-(--foreground-muted)">Perfil activo en marketplace local.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleContact}
              disabled={!hasWhatsAppContact}
              className="thsj-btn thsj-btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4-1.1l-.3-.2-3.1.8.8-3-.2-.3A8 8 0 1 1 12 20Zm4.3-6.1c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.2-.4.1a6.6 6.6 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.3-1.6c-.1-.2 0-.3.1-.4l.3-.3.2-.3.1-.3c0-.1 0-.2 0-.3l-.7-1.6c-.2-.4-.3-.4-.5-.4h-.4a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.1c0 1.3.9 2.5 1 2.7.1.2 1.8 2.8 4.5 3.8 2.6 1 2.6.7 3 .7.5 0 1.5-.6 1.7-1.2.2-.6.2-1 .1-1.2-.1-.2-.2-.2-.5-.3Z" />
              </svg>
              {hasWhatsAppContact ? 'WhatsApp vendedor' : 'Sin WhatsApp cargado'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="thsj-btn thsj-btn-ghost inline-flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18 16a3 3 0 0 0-2.3 1.1L8.9 13a3.4 3.4 0 0 0 0-2l6.7-4.1A3 3 0 1 0 15 5a3.4 3.4 0 0 0 .1.8L8.4 9.9a3 3 0 1 0 0 4.2l6.7 4.1A3 3 0 1 0 18 16Z" />
              </svg>
              {shareFeedback ?? 'Compartir publicacion'}
            </button>
          </div>
        </aside>
      </div>

      <div className="thsj-panel p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Publicaciones similares</h2>
          <span className="text-xs font-medium uppercase tracking-wide text-(--foreground-muted)">
            Categoria: {post.category}
          </span>
        </div>

        {relatedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-(--line) bg-(--background-muted) px-5 py-8 text-center text-sm text-(--foreground-muted)">
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
