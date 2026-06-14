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
  const selectedCategoryData = categories.find((category) => category.name === selectedCategory)
  const activeSubcategories = selectedCategoryData?.subcategories ?? []
  const shouldShowSubcategorySelect =
    selectedCategory !== 'Todas' && activeSubcategories.length > 0

  return (
    <div className={['space-y-3', className ?? ''].join(' ')}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--foreground-muted)">
            ▾
          </span>
        </label>

        {shouldShowSubcategorySelect ? (
          <label className="relative flex w-full">
            <select
              value={selectedSubcategory}
              onChange={(event) => {
                const nextSubcategory = event.target.value
                if (nextSubcategory === 'Todas') {
                  onChangeCategory(selectedCategory)
                  return
                }

                onChangeSubcategory(selectedCategory, nextSubcategory)
              }}
              className="thsj-input w-full appearance-none px-3 py-2.5 pr-9 text-sm"
              aria-label="Subcategoria"
            >
              <option value="Todas">Todas las subcategorias</option>
              {activeSubcategories.map((subcategory) => (
                <option key={`${selectedCategory}-${subcategory.name}`} value={subcategory.name}>
                  {typeof subcategory.postCount === 'number'
                    ? `${subcategory.name} (${subcategory.postCount})`
                    : subcategory.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-(--foreground-muted)">
              ▾
            </span>
          </label>
        ) : (
          <div className="hidden sm:block" aria-hidden="true" />
        )}
      </div>
    </div>
  )
}
