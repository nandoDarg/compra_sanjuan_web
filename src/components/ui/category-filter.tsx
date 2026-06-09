import { useEffect, useState } from 'react'

type CategoryFilterItem = {
  name: string
  postCount?: number
  subcategories: Array<{
    name: string
    postCount?: number
  }>
}

type CategoryFilterProps = {
  categories: CategoryFilterItem[]
  selectedCategory: string
  selectedSubcategory: string
  onChangeCategory: (category: string) => void
  onChangeSubcategory: (category: string, subcategory: string) => void
  className?: string
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  selectedSubcategory,
  onChangeCategory,
  onChangeSubcategory,
  className,
}: CategoryFilterProps) {
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
    <div className={['space-y-2', className ?? ''].join(' ')}>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onChangeCategory('Todas')}
          className={[
            'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition',
            selectedCategory === 'Todas'
              ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
              : 'thsj-chip hover:border-(--line-strong) hover:bg-(--background-elevated)',
          ].join(' ')}
        >
          Todas
        </button>
      </div>

      <div className="space-y-2">
        {categories.map((category) => {
          const isActive = selectedCategory === category.name
          const isExpanded = expandedCategory === category.name
          const hasSubcategories = category.subcategories.length > 0

        return (
          <div key={category.name} className="rounded-2xl border border-(--line) bg-(--background-elevated)">
            <button
              type="button"
              onClick={() => {
                if (selectedCategory === category.name && expandedCategory === category.name) {
                  setExpandedCategory(null)
                  return
                }

                if (hasSubcategories) {
                  setExpandedCategory((current) =>
                    current === category.name ? null : category.name
                  )
                }

                onChangeCategory(category.name)
              }}
              className={[
                'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition',
                isActive
                  ? 'bg-(--brand-primary) text-white shadow-sm'
                  : 'text-foreground hover:bg-(--background-muted)',
              ].join(' ')}
            >
              <span className="truncate">{category.name}</span>
              <span className="flex items-center gap-2">
                {typeof category.postCount === 'number' ? (
                  <span
                    className={[
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-(--background-muted) text-(--foreground-muted)',
                    ].join(' ')}
                  >
                    {category.postCount}
                  </span>
                ) : null}
                {hasSubcategories ? (
                  <span className={['text-xs transition', isExpanded ? 'rotate-180' : ''].join(' ')}>
                    ▾
                  </span>
                ) : null}
              </span>
            </button>

            {isExpanded && hasSubcategories ? (
              <div className="flex gap-2 overflow-x-auto border-t border-(--line) px-3 py-2 pb-3">
                <button
                  type="button"
                  onClick={() => onChangeCategory(category.name)}
                  className={[
                    'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
                    isActive && selectedSubcategory === 'Todas'
                      ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                      : 'thsj-chip hover:border-(--line-strong) hover:bg-(--background-muted)',
                  ].join(' ')}
                >
                  Todas
                </button>

                {category.subcategories.map((subcategory) => {
                  const isSubcategoryActive =
                    isActive && selectedSubcategory === subcategory.name

                  return (
                    <button
                      key={`${category.name}-${subcategory.name}`}
                      type="button"
                      onClick={() => onChangeSubcategory(category.name, subcategory.name)}
                      className={[
                        'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
                        isSubcategoryActive
                          ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                          : 'thsj-chip hover:border-(--line-strong) hover:bg-(--background-muted)',
                      ].join(' ')}
                    >
                      {subcategory.name}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
        })}
      </div>
    </div>
  )
}
