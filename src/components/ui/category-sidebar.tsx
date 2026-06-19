import {
  getSubcategories,
  getTertiarySubcategories,
  resolveCategorySelection,
} from '@/lib/hierarchical-categories'

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
  // Resolve selection from URL params
  const resolved =
    selectedCategory !== 'Todas' && selectedSubcategory !== 'Todas'
      ? resolveCategorySelection(selectedCategory, selectedSubcategory)
      : null

  const isAtTertiary = Boolean(resolved?.tertiarySubcategory)
  const resolvedSubcategory = resolved?.subcategory ?? null

  // Navigation level flags
  const isAtRoot = selectedCategory === 'Todas'
  const isAtCategoryLevel = !isAtRoot && selectedSubcategory === 'Todas'
  const isAtSubcategoryLevel = !isAtRoot && !isAtCategoryLevel

  // Tertiary children of the current browsed 2nd-level sub
  const browsedSub = resolvedSubcategory ?? (isAtSubcategoryLevel ? selectedSubcategory : null)
  const tertiaryChildren = browsedSub ? getTertiarySubcategories(selectedCategory, browsedSub) : []
  const hasTertiaryChildren = tertiaryChildren.length > 0

  // 2nd-level subcategories from the tree
  const treeSubcategories =
    isAtCategoryLevel || isAtSubcategoryLevel ? getSubcategories(selectedCategory) : []

  // Post count map for 2nd-level subs
  const categoryStats = categories.find((c) => c.name === selectedCategory)
  const subCountMap = new Map(
    (categoryStats?.subcategories ?? []).map((s) => [s.name, s.postCount])
  )

  // Shared button class helpers
  const activeBtn =
    'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
  const inactiveBtn =
    'border-transparent text-foreground hover:border-(--line-strong) hover:bg-(--background-elevated)'
  const activeSubBtn =
    'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
  const inactiveSubBtn =
    'border-transparent text-(--foreground-muted) hover:border-(--line-strong) hover:bg-(--background-elevated)'

  const rowClass =
    'flex w-full items-start justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition'
  const backBtnClass =
    'flex w-full items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-left text-sm font-medium text-(--foreground-muted) transition hover:border-(--line-strong) hover:bg-(--background-elevated)'
  const sectionLabelClass =
    'px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-(--foreground-muted)'

  return (
    <aside className="thsj-panel hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overflow-x-hidden">
      <div className="border-b border-(--line) p-4 pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-(--foreground-muted)">
          Categorias
        </p>
      </div>

      <div className="space-y-1 p-2">
        {/* LEVEL 0 — root: all categories */}
        {isAtRoot ? (
          <>
            <button
              type="button"
              onClick={() => onSelectCategory('Todas')}
              className={`${rowClass} ${activeBtn}`}
            >
              <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">Todas las categorias</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => onSelectCategory(category.name)}
                className={`${rowClass} ${inactiveBtn}`}
              >
                <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">{category.name}</span>
                <span className="ml-3 rounded-full bg-(--background-muted) px-2 py-0.5 text-xs font-semibold text-(--foreground-muted)">
                  {category.postCount}
                </span>
              </button>
            ))}
          </>
        ) : isAtCategoryLevel ? (
          /* LEVEL 1 — category selected: show its subcategories */
          <>
            <button type="button" onClick={() => onSelectCategory('Todas')} className={backBtnClass}>
              ← Volver
            </button>
            <p className={sectionLabelClass}>{selectedCategory}</p>
            {treeSubcategories.map((sub) => {
              const count = subCountMap.get(sub.name)
              return (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => onSelectSubcategory(selectedCategory, sub.name)}
                  className={`${rowClass} ps-4 ${inactiveSubBtn}`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">{sub.name}</span>
                  {count !== undefined ? (
                    <span className="ml-3 rounded-full bg-(--background-muted) px-2 py-0.5 text-xs font-semibold text-(--foreground-muted)">
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </>
        ) : isAtSubcategoryLevel && hasTertiaryChildren && !isAtTertiary ? (
          /* LEVEL 2 — subcategory with tertiary children: show them */
          <>
            <button
              type="button"
              onClick={() => onSelectCategory(selectedCategory)}
              className={backBtnClass}
            >
              ← Volver
            </button>
            <p className={sectionLabelClass}>{browsedSub}</p>
            {tertiaryChildren.map((tertiary) => (
              <button
                key={tertiary.name}
                type="button"
                onClick={() => onSelectSubcategory(selectedCategory, tertiary.name)}
                className={`${rowClass} ps-4 ${inactiveSubBtn}`}
              >
                <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">{tertiary.name}</span>
              </button>
            ))}
          </>
        ) : isAtTertiary ? (
          /* LEVEL 3 — tertiary selected: show siblings, highlight active */
          <>
            <button
              type="button"
              onClick={() => onSelectSubcategory(selectedCategory, browsedSub!)}
              className={backBtnClass}
            >
              ← Volver
            </button>
            <p className={sectionLabelClass}>{browsedSub}</p>
            {tertiaryChildren.map((tertiary) => {
              const isActive = resolved?.tertiarySubcategory === tertiary.name
              return (
                <button
                  key={tertiary.name}
                  type="button"
                  onClick={() => onSelectSubcategory(selectedCategory, tertiary.name)}
                  className={`${rowClass} ps-4 ${isActive ? activeSubBtn : inactiveSubBtn}`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">{tertiary.name}</span>
                </button>
              )
            })}
          </>
        ) : (
          /* LEAF — 2nd-level leaf selected: show siblings, highlight active */
          <>
            <button
              type="button"
              onClick={() => onSelectCategory(selectedCategory)}
              className={backBtnClass}
            >
              ← Volver
            </button>
            <p className={sectionLabelClass}>{selectedCategory}</p>
            {treeSubcategories.map((sub) => {
              const count = subCountMap.get(sub.name)
              const isActive = sub.name === selectedSubcategory
              return (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => onSelectSubcategory(selectedCategory, sub.name)}
                  className={`${rowClass} ${isActive ? activeSubBtn : inactiveSubBtn}`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal wrap-break-word text-left leading-tight">{sub.name}</span>
                  {count !== undefined ? (
                    <span
                      className={`ml-3 rounded-full px-2 py-0.5 text-xs font-semibold ${isActive ? 'bg-white/15 text-white' : 'bg-(--background-muted) text-(--foreground-muted)'}`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </>
        )}
      </div>
    </aside>
  )
}
