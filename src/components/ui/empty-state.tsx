import Link from 'next/link'

type EmptyStateProps = {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}

export default function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyStateProps) {
  return (
    <div className="thsj-panel border-dashed px-6 py-12 text-center sm:px-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-accent-soft)]">
        <img src="/icon.svg" alt="THSJ" className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--foreground-muted)]">{description}</p>
      <Link
        href={ctaHref}
        className="thsj-btn thsj-btn-primary mt-6"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
