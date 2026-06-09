import { useEffect, useState } from 'react'

type CategoryStat = {
  name: string
  postCount: number
  subcategories: Array<{
    name: string
    postCount: number
  }>
}

type CategorySidebarProps = {
  categories: CategoryStat[]
  selectedCategory: string
  selectedSubcategory: string
  onSelectCategory: (category: string) => void
  onSelectSubcategory: (category: string, subcategory: string) => void
}

export default function CategorySidebar({
  categories,
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
}: CategorySidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  useEffect(() => {
    if (selectedCategory === 'Todas') {
      setExpandedCategory(null)
      return
    }

    if (selectedSubcategory !== 'Todas') {
      setExpandedCategory(selectedCategory)
    }
  }, [selectedCategory, selectedSubcategory])

  return (
    <aside className="thsj-panel hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="border-b border-(--line) p-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Categorias
        </p>
      </div>

      <div className="space-y-1 p-2">
        {categories.map((category) => {
          const isCategoryActive = selectedCategory === category.name
          const isExpanded = expandedCategory === category.name

          return (
            <div key={category.name} className="rounded-xl border border-transparent">
              <button
                type="button"
                onClick={() => {
                  if (selectedCategory === category.name && expandedCategory === category.name) {
                    setExpandedCategory(null)
                    return
                  }

                  setExpandedCategory((current) =>
                    current === category.name ? null : category.name
                  )
                  onSelectCategory(category.name)
                }}
                aria-current={isCategoryActive ? 'true' : undefined}
                className={[
                  'flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition',
                  isCategoryActive
                    ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                    : 'border-transparent text-foreground hover:border-(--line-strong) hover:bg-(--background-elevated)',
                ].join(' ')}
              >
                <span className="truncate">{category.name}</span>
                <span
                  className={[
                    'ml-3 rounded-full px-2 py-0.5 text-xs font-semibold',
                    isCategoryActive
                      ? 'bg-white/15 text-white'
                      : 'bg-(--background-muted) text-(--foreground-muted)',
                  ].join(' ')}
                >
                  {category.postCount}
                </span>
              </button>

              {isExpanded && category.subcategories.length > 0 ? (
                <div className="mt-1 space-y-1 pl-2">
                  {category.subcategories.map((subcategory) => {
                    const isSubcategoryActive =
                      isCategoryActive && selectedSubcategory === subcategory.name

                    return (
                      <button
                        key={`${category.name}-${subcategory.name}`}
                        type="button"
                        onClick={() => onSelectSubcategory(category.name, subcategory.name)}
                        className={[
                          'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition',
                          isSubcategoryActive
                            ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                            : 'border-transparent text-(--foreground-muted) hover:border-(--line-strong) hover:bg-(--background-elevated)',
                        ].join(' ')}
                      >
                        <span className="truncate">{subcategory.name}</span>
                        <span
                          className={[
                            'ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            isSubcategoryActive
                              ? 'bg-white/15 text-white'
                              : 'bg-(--background-muted) text-(--foreground-muted)',
                          ].join(' ')}
                        >
                          {subcategory.postCount}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </aside>
  )
}