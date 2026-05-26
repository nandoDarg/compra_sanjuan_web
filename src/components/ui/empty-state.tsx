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
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <div className="h-6 w-6 rounded-lg bg-slate-300" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 inline-flex items-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
