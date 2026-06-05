type CategoryStat = {
  name: string
  postCount: number
  clickCount: number
}

type CategorySidebarProps = {
  categories: CategoryStat[]
  selectedCategory: string
  onChange: (category: string) => void
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  onChange,
}: CategorySidebarProps) {
  return (
    <aside className="thsj-panel hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="border-b border-(--line) p-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Categorias
        </p>
      </div>

      <div className="space-y-1 p-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category.name

          return (
            <button
              key={category.name}
              type="button"
              onClick={() => onChange(category.name)}
              aria-current={isActive ? 'true' : undefined}
              className={[
                'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                isActive
                  ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                  : 'border-transparent text-foreground hover:border-(--line-strong) hover:bg-(--background-elevated)',
              ].join(' ')}
            >
              <span className="truncate">{category.name}</span>
              <span
                className={[
                  'ml-3 rounded-full px-2 py-0.5 text-xs font-semibold',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-(--background-muted) text-(--foreground-muted)',
                ].join(' ')}
              >
                {category.postCount}
              </span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}