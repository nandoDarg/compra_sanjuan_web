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
  onOpen?: () => void
}

function formatPublishedAt(value?: string) {
  if (!value) {
    return 'Publicado recientemente'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Publicado recientemente'
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function PostCard({
  id,
  title,
  description,
  category,
  locationDepartment,
  price,
  imageUrl,
  href,
  publishedAt,
  actions,
  onOpen,
}: PostCardProps) {
  const cardContent = (
    <>
      {imageUrl ? (
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/25 to-transparent" />
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center bg-[var(--background-muted)] text-sm text-[var(--foreground-muted)]">
          Sin imagen
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="font-[var(--font-space-grotesk)] text-2xl font-extrabold tracking-tight text-[var(--brand-primary)]">
          ${Number(price).toFixed(2)}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-semibold text-[var(--foreground)] sm:text-lg">
            {title}
          </h2>
          <span className="rounded-full border border-[var(--line)] bg-[var(--background-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)]">
            {category}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3 text-sm text-[var(--foreground-muted)]">
          {locationDepartment ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true">📍</span>
              {locationDepartment}
            </span>
          ) : <span />}
          <span className="text-xs text-[var(--foreground-muted)]">{formatPublishedAt(publishedAt)}</span>
        </div>
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
