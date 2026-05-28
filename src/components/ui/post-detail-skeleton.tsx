export default function PostDetailSkeleton() {
  return (
    <section className="flex w-full flex-1 flex-col gap-6 py-6 sm:py-8">
      <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="h-72 animate-pulse bg-slate-200 sm:h-[420px]" />
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-10 w-44 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-11 animate-pulse rounded-xl bg-slate-200" />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white">
              <div className="h-36 animate-pulse bg-slate-200" />
              <div className="space-y-2 p-4">
                <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
