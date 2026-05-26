type PostCardProps = {
  title: string
  description: string
  category: string
  price: number
  imageUrl: string | null
}

export default function PostCard({
  title,
  description,
  category,
  price,
  imageUrl,
}: PostCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {imageUrl ? (
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
        </div>
      ) : (
        <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-500">
          Sin imagen
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="text-2xl font-extrabold tracking-tight text-emerald-700">
          ${Number(price).toFixed(2)}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h2 className="line-clamp-2 text-base font-semibold text-slate-900 sm:text-lg">
            {title}
          </h2>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {category}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            San Juan, AR
          </span>
          <span className="text-xs text-slate-400">Publicado hoy</span>
        </div>
      </div>
    </article>
  )
}
