import Link from 'next/link'
import type { ReactNode } from 'react'

type PostCardProps = {
  id?: string
  title: string
  description: string
  category: string
  locationDepartment?: string | null
  price: number
  imageUrl: string | null
  href?: string
  publishedAt?: string
  actions?: ReactNode
  imageOverlay?: ReactNode
  onOpen?: () => void
}

export default function PostCard({
  id,
  title,
  category,
  price,
  imageUrl,
  href,
  actions,
  imageOverlay,
  onOpen,
}: PostCardProps) {
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(price))

  const cardContent = (
    <>
      {imageUrl ? (
        <div className="relative aspect-square overflow-hidden bg-neutral-900">
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          {imageOverlay ? <div className="absolute right-2 top-2 z-10">{imageOverlay}</div> : null}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/25 to-transparent" />
        </div>
      ) : (
        <div className="relative flex aspect-square flex-col items-center justify-center gap-2 bg-[var(--background-muted)]">
          {imageOverlay ? <div className="absolute right-2 top-2 z-10">{imageOverlay}</div> : null}
          <img
            src="/icon.svg"
            alt=""
            aria-hidden="true"
            className="h-14 w-14 opacity-40 sm:h-16 sm:w-16"
          />
          <span className="text-xs text-[var(--foreground-muted)]">Sin imagen</span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <div className="font-[var(--font-space-grotesk)] text-base font-semibold tracking-tight text-[var(--brand-primary)]">
          {formattedPrice}
        </div>

        <h2 className="min-h-[1.75rem] line-clamp-2 !text-[14px] font-medium leading-[1.15rem] text-[var(--foreground)] sm:min-h-[1.9rem] sm:!text-[14px]">
          {title}
        </h2>

        <p className="line-clamp-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          {category}
        </p>
      </div>
    </>
  )

  const containerClassName =
    'thsj-card group flex h-full flex-col overflow-hidden'

  return (
    <article className={containerClassName} data-post-id={id}>
      {href ? (
        <Link
          href={href}
          className="flex flex-1 flex-col"
          aria-label={`Ver detalle de ${title}`}
          onClick={onOpen}
        >
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}

      {actions ? <div className="flex flex-wrap gap-2 px-4 pb-4 sm:px-5 sm:pb-5">{actions}</div> : null}
    </article>
  )
}
