type FeedSkeletonProps = {
  items?: number
}

export default function FeedSkeleton({ items = 8 }: FeedSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
        >
          <div className="h-56 animate-pulse bg-slate-200" />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-200" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
