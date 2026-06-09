'use client'

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import PostCard from '@/components/post-card'
import { useAuth } from '@/components/auth-provider'
import EmptyState from '@/components/ui/empty-state'
import PostDetailSkeleton from '@/components/ui/post-detail-skeleton'
import { createClient } from '@/lib/supabase-client'
import { ANALYTICS_EVENTS, trackEvent } from '@/lib/analytics/tracking'
import { getCategoryPathLabel } from '@/lib/hierarchical-categories'
import { resolveCategorySelection } from '@/lib/hierarchical-categories'
import { isMissingSubcategoryColumnError } from '@/lib/post-subcategory-compat'
import type { VehicleDetailsInput } from '@/lib/vehicle-details'
import { isValidGoogleMapsUrl } from '@/lib/post-location'

type Post = {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  category: string
  subcategory: string | null
  condition: 'new' | 'used' | null
  whatsapp_number: string | null
  location_department: string | null
  location_maps_url: string | null
  image_url: string | null
  created_at: string
}

type PostImage = {
  image_url: string
}

type VehicleDetailsRow = VehicleDetailsInput

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
  const { user } = useAuth()

  const [post, setPost] = useState<Post | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([])
  const [postImages, setPostImages] = useState<string[]>([])
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetailsInput | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [sellerDisplayName, setSellerDisplayName] = useState('Usuario')
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false)
  const [modalImageZoom, setModalImageZoom] = useState(1)
  const [modalZoomOrigin, setModalZoomOrigin] = useState('50% 50%')
  const trackedPostViewIdRef = useRef<string | null>(null)

  // La lupa secundaria del modal de zoom se desactivo porque agregaba ruido visual
  // y una imagen pixelada que no aporta valor en la experiencia de usuario.
  // const [lensState, setLensState] = useState<{
  //   left: number
  //   top: number
  //   imgW: number
  //   imgH: number
  //   lensW: number
  //   lensH: number
  // } | null>(null)
  // const mainImageContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      setErrorMsg(null)
      setSellerDisplayName('Usuario')

      let { data, error } = await supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,subcategory,condition,whatsapp_number,location_department,location_maps_url,image_url,created_at')
        .eq('id', postId)
        .single()

      if (error && isMissingSubcategoryColumnError(error)) {
        const fallbackResult = await supabase
          .from('posts')
          .select('id,user_id,title,description,price,category,condition,whatsapp_number,location_department,location_maps_url,image_url,created_at')
          .eq('id', postId)
          .single()

        error = fallbackResult.error
        data = fallbackResult.data
          ? { ...fallbackResult.data, subcategory: null }
          : null
      }

      if (error || !data) {
        setPost(null)
        setErrorMsg('No pudimos encontrar esta publicacion.')
        setLoading(false)
        return
      }

      const normalizedPost = {
        ...data,
        ...resolveCategorySelection(data.category, data.subcategory),
      }

      setPost(normalizedPost)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', data.user_id)
        .maybeSingle()

      setSellerDisplayName(profileData?.display_name?.trim() || 'Usuario')

      const { data: extraImagesData } = await supabase
        .from('post_images')
        .select('image_url')
        .eq('post_id', data.id)
        .order('position', { ascending: true })

      const mergedImages = [
        data.image_url,
        ...((extraImagesData as PostImage[] | null)?.map((item) => item.image_url) ?? []),
      ].filter((value): value is string => Boolean(value))

      setPostImages(Array.from(new Set(mergedImages)))
      setSelectedImageIndex(0)

      const { data: vehicleDetailsData } = await supabase
        .from('vehicle_details')
        .select('brand,model,year,mileage,fuel_type,transmission,condition,first_owner')
        .eq('post_id', data.id)
        .limit(1)
        .maybeSingle()

      setVehicleDetails((vehicleDetailsData as VehicleDetailsRow | null) ?? null)

      let relatedQuery = supabase
        .from('posts')
        .select('id,user_id,title,description,price,category,subcategory,condition,whatsapp_number,location_department,location_maps_url,image_url,created_at')
        .eq('category', normalizedPost.category)
        .neq('id', normalizedPost.id)
        .order('created_at', { ascending: false })
        .limit(4)

      if (normalizedPost.subcategory) {
        relatedQuery = relatedQuery.eq('subcategory', normalizedPost.subcategory)
      }

      let { data: relatedData, error: relatedError } = await relatedQuery

      if (relatedError && isMissingSubcategoryColumnError(relatedError)) {
        const fallbackRelated = await supabase
          .from('posts')
          .select('id,user_id,title,description,price,category,condition,whatsapp_number,location_department,location_maps_url,image_url,created_at')
          .eq('category', normalizedPost.category)
          .neq('id', normalizedPost.id)
          .order('created_at', { ascending: false })
          .limit(4)

        relatedData = (fallbackRelated.data ?? []).map((post) => ({
          ...post,
          subcategory: null,
        }))
        relatedError = fallbackRelated.error
      }

      if (relatedError) {
        setRelatedPosts([])
        setLoading(false)
        return
      }

      setRelatedPosts(
        (relatedData ?? []).map((post) => ({
          ...post,
          ...resolveCategorySelection(post.category, post.subcategory),
        }))
      )
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

  useEffect(() => {
    if (!isZoomModalOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsZoomModalOpen(false)
        setModalImageZoom(1)
        setModalZoomOrigin('50% 50%')
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isZoomModalOpen])

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

    const listingUrl = window.location.href
    const formattedPrice = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2,
    }).format(post.price)

    const message = encodeURIComponent(
      `Hola, vi tu publicación en tratohechoSJ:\n${post.title}\n${formattedPrice}\n${listingUrl}`
    )
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
  const isOwner = user?.id === post.user_id
  const hasLocation = Boolean(post.location_department?.trim())
  const hasMapsLocation = Boolean(
    post.location_maps_url?.trim() && isValidGoogleMapsUrl(post.location_maps_url)
  )

  const canNavigateImages = postImages.length > 1
  const MODAL_ZOOM_SCALE = 2.2

  const goToPreviousImage = () => {
    if (!canNavigateImages) {
      return
    }

    setSelectedImageIndex((previous) => (previous - 1 + postImages.length) % postImages.length)
    setModalImageZoom(1)
    setModalZoomOrigin('50% 50%')
  }

  const goToNextImage = () => {
    if (!canNavigateImages) {
      return
    }

    setSelectedImageIndex((previous) => (previous + 1) % postImages.length)
    setModalImageZoom(1)
    setModalZoomOrigin('50% 50%')
  }

  const handleModalImageClick = (event: MouseEvent<HTMLImageElement>) => {
    if (modalImageZoom !== 1) {
      setModalImageZoom(1)
      setModalZoomOrigin('50% 50%')
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    if (rect.width <= 0 || rect.height <= 0) {
      return
    }

    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    const boundedX = Math.max(0, Math.min(100, x))
    const boundedY = Math.max(0, Math.min(100, y))

    setModalZoomOrigin(`${boundedX}% ${boundedY}%`)
    setModalImageZoom(MODAL_ZOOM_SCALE)
  }

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
        <div className="relative">
        <article className="thsj-card overflow-hidden">
          {postImages.length > 0 ? (
            <div className="relative aspect-square w-full overflow-hidden bg-neutral-900">
              <img
                src={postImages[selectedImageIndex]}
                alt={post.title}
                className="h-full w-full cursor-zoom-in object-contain"
                onClick={() => {
                  setIsZoomModalOpen(true)
                  setModalImageZoom(1)
                  setModalZoomOrigin('50% 50%')
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setIsZoomModalOpen(true)
                  setModalImageZoom(1)
                  setModalZoomOrigin('50% 50%')
                }}
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--line) bg-white/90 text-foreground shadow transition hover:bg-white"
                aria-label="Ampliar imagen"
                title="Ampliar imagen"
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </button>

              {canNavigateImages ? (
                <button
                  type="button"
                  onClick={goToPreviousImage}
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow transition hover:bg-black/50"
                  aria-label="Imagen anterior"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
              ) : null}

              {canNavigateImages ? (
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white shadow transition hover:bg-black/50"
                  aria-label="Imagen siguiente"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-(--background-muted) text-sm text-(--foreground-muted)">
              Sin imagen disponible
            </div>
          )}

          {postImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 border-t border-(--line) bg-(--background-muted) p-3 sm:grid-cols-6">
              {postImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  onMouseEnter={() => setSelectedImageIndex(index)}
                  onFocus={() => setSelectedImageIndex(index)}
                  className={`aspect-square overflow-hidden rounded-lg border transition ${
                    selectedImageIndex === index
                      ? 'border-(--brand-primary) ring-1 ring-(--brand-primary)'
                      : 'border-(--line) hover:border-(--line-strong)'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${post.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </article>

        </div>

        <aside className="thsj-panel p-5 sm:p-6">
          <div className="thsj-chip inline-flex items-center px-3 py-1 text-xs font-medium">
            {getCategoryPathLabel(post.category, post.subcategory)}
          </div>

          {post.condition ? (
            <span
              className={[
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                post.condition === 'new'
                  ? 'border-[var(--success)] bg-[#dcfce7] text-[var(--success)]'
                  : 'border-(--line-strong) bg-(--background-muted) text-(--foreground-muted)',
              ].join(' ')}
            >
              {post.condition === 'new' ? 'Nuevo' : 'Usado'}
            </span>
          ) : null}

          <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {post.title}
          </h1>

          <p className="mt-4 text-3xl font-extrabold tracking-tight text-(--brand-primary) sm:text-4xl">
            ${Number(post.price).toFixed(2)}
          </p>

          {vehicleDetails ? (
            <div className="mt-4 rounded-2xl border border-(--line) bg-(--background-elevated) p-4 text-sm text-(--foreground-muted)">
              <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">
                Informacion del vehiculo
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Marca</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.brand}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Modelo</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.model}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Año</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.year}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Kilometros</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.mileage.toLocaleString('es-AR')}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Combustible</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.fuel_type}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Transmision</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.transmission}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Estado</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.condition}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-(--foreground-muted)">Primera mano</dt>
                  <dd className="font-medium text-foreground">{vehicleDetails.first_owner ? 'Si' : 'No'}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="mt-6 space-y-4 text-sm text-(--foreground-muted)">
            <div className="rounded-2xl border border-(--line) bg-(--background-muted) p-4">
              <p className="font-medium text-foreground">Descripcion</p>
              <p className="mt-2 leading-6">{post.description}</p>
            </div>

            <div className={`grid grid-cols-1 gap-3 ${hasLocation ? 'sm:grid-cols-2' : ''}`}>
              {hasLocation ? (
                <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
                  <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Ubicacion</p>
                  <p className="mt-1 font-medium text-foreground">📍 {post.location_department}</p>
                  {hasMapsLocation ? (
                    <a
                      href={post.location_maps_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex text-sm text-(--brand-primary) hover:underline"
                    >
                      Ver ubicacion en Google Maps
                    </a>
                  ) : null}
                </div>
              ) : null}
              <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
                <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Publicacion</p>
                <p className="mt-1 font-medium text-foreground">{formatLongDate(post.created_at)}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-(--line) bg-(--background-elevated) p-4">
              <p className="text-xs uppercase tracking-wide text-(--foreground-muted)">Vendedor</p>
              <p className="mt-1 font-medium text-foreground">{sellerDisplayName || 'Usuario'}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {isOwner ? (
              <Link
                href={`/my-posts/${post.id}/edit`}
                className="thsj-btn thsj-btn-ghost inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm sm:col-span-2"
              >
                Editar publicacion
              </Link>
            ) : null}
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
                  category={getCategoryPathLabel(relatedPost.category, relatedPost.subcategory)}
                locationDepartment={relatedPost.location_department}
                price={relatedPost.price}
                imageUrl={relatedPost.image_url}
                href={`/post/${relatedPost.id}`}
                publishedAt={relatedPost.created_at}
              />
            ))}
          </div>
        )}
      </div>

      {isZoomModalOpen ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center overflow-auto bg-black/85 p-4"
          onClick={() => {
            setIsZoomModalOpen(false)
            setModalImageZoom(1)
            setModalZoomOrigin('50% 50%')
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsZoomModalOpen(false)
              setModalImageZoom(1)
              setModalZoomOrigin('50% 50%')
            }}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/55 text-2xl leading-none text-white hover:bg-black/70"
            aria-label="Cerrar vista ampliada"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>

          {canNavigateImages ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                goToPreviousImage()
              }}
              className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white hover:bg-black/70"
              aria-label="Imagen anterior"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          ) : null}

          {canNavigateImages ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                goToNextImage()
              }}
              className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white hover:bg-black/70"
              aria-label="Imagen siguiente"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ) : null}

          <div
            className="relative aspect-square w-[min(95vw,95vh)] max-w-[1200px] overflow-hidden rounded-xl bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={postImages[selectedImageIndex]}
              alt={post.title}
              className={`block h-full w-full object-contain transition-transform duration-200 ease-out ${
                modalImageZoom === 1 ? 'cursor-zoom-in' : 'cursor-zoom-out'
              }`}
              onClick={handleModalImageClick}
              style={{
                transform: `scale(${modalImageZoom})`,
                transformOrigin: modalZoomOrigin,
              }}
            />

            {/*
              Lupa secundaria desactivada:
              se removio porque duplicaba el zoom, introducia pixelado y no mejoraba la lectura de imagen.
            */}
          </div>
        </div>
      ) : null}
    </section>
  )
}
