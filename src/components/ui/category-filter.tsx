import {
  getSubcategories,
  getTertiarySubcategories,
  resolveCategorySelection,
} from '@/lib/hierarchical-categories'

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
  // Resolve current selection to determine level
  const resolved =
    selectedCategory !== 'Todas' && selectedSubcategory !== 'Todas'
      ? resolveCategorySelection(selectedCategory, selectedSubcategory)
      : null

  // 2nd-level sub that is currently browsed
  const resolvedSub = resolved?.subcategory ?? (selectedSubcategory !== 'Todas' ? selectedSubcategory : null)
  const currentTertiary = resolved?.tertiarySubcategory ?? null

  // Tertiary children of the browsed 2nd-level sub
  const tertiaryChildren = resolvedSub
    ? getTertiarySubcategories(selectedCategory, resolvedSub)
    : []
  const hasTertiaryChildren = tertiaryChildren.length > 0

  // 2nd-level subcategories for select 2
  const subcategoriesForSelect2: Array<{ name: string; postCount?: number }> =
    selectedCategory !== 'Todas'
      ? (categories.find((c) => c.name === selectedCategory)?.subcategories ??
         getSubcategories(selectedCategory).map((s) => ({ name: s.name })))
      : []

  // Only show select 2 when a category is chosen and it has subcategories
  const showSelectTwo = selectedCategory !== 'Todas' && subcategoriesForSelect2.length > 0
  // Show select 3 when a 2nd-level sub with tertiary children is browsed
  const showSelectThree = showSelectTwo && resolvedSub !== null && hasTertiaryChildren

  const selectArrow = (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--foreground-muted)">
      ▾
    </span>
  )

  return (
    <div className={['space-y-2', className ?? ''].join(' ')}>
      {/* SELECT 1 — root category */}
      <label className="relative flex w-full">
        <select
          value={selectedCategory}
          onChange={(event) => onChangeCategory(event.target.value)}
          className="thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm"
          aria-label="Categoria principal"
        >
          <option value="Todas">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.name} value={category.name}>
              {typeof category.postCount === 'number'
                ? `${category.name} (${category.postCount})`
                : category.name}
            </option>
          ))}
        </select>
        {selectArrow}
      </label>

      {/* SELECT 2 — 2nd-level subcategory */}
      {showSelectTwo ? (
        <label className="relative flex w-full">
          <select
            value={resolvedSub ?? 'Todas'}
            onChange={(event) => {
              const next = event.target.value
              if (next === 'Todas') {
                onChangeCategory(selectedCategory)
              } else {
                onChangeSubcategory(selectedCategory, next)
              }
            }}
            className="thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm"
            aria-label="Subcategoria"
          >
            <option value="Todas">Todas las subcategorias</option>
            {subcategoriesForSelect2.map((sub) => (
              <option key={`${selectedCategory}-${sub.name}`} value={sub.name}>
                {typeof sub.postCount === 'number'
                  ? `${sub.name} (${sub.postCount})`
                  : sub.name}
              </option>
            ))}
          </select>
          {selectArrow}
        </label>
      ) : null}

      {/* SELECT 3 — tertiary level */}
      {showSelectThree ? (
        <label className="relative flex w-full">
          <select
            value={currentTertiary ?? 'Todas'}
            onChange={(event) => {
              const next = event.target.value
              if (next === 'Todas') {
                onChangeSubcategory(selectedCategory, resolvedSub!)
              } else {
                onChangeSubcategory(selectedCategory, `${resolvedSub} > ${next}`)
              }
            }}
            className="thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm"
            aria-label="Subcategoria especifica"
          >
            <option value="Todas">Todo en {resolvedSub}</option>
            {tertiaryChildren.map((tertiary) => (
              <option key={`${resolvedSub}-${tertiary.name}`} value={tertiary.name}>
                {tertiary.name}
              </option>
            ))}
          </select>
          {selectArrow}
        </label>
      ) : null}
    </div>
  )
}
