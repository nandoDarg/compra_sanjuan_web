type SortOption = 'recent' | 'price-asc' | 'price-desc'

type ActiveFilterChipsProps = {
  searchQuery: string
  selectedCategory: string
  selectedSubcategory: string
  sortBy: SortOption
  onRemoveSearch: () => void
  onRemoveCategory: () => void
  onRemoveSubcategory: () => void
  onRemoveSort: () => void
}

const sortLabels: Record<Exclude<SortOption, 'recent'>, string> = {
  'price-asc': 'Menor precio',
  'price-desc': 'Mayor precio',
}

export default function ActiveFilterChips({
  searchQuery,
  selectedCategory,
  selectedSubcategory,
  sortBy,
  onRemoveSearch,
  onRemoveCategory,
  onRemoveSubcategory,
  onRemoveSort,
}: ActiveFilterChipsProps) {
  const hasSearch = searchQuery.length > 0
  const hasCategory = selectedCategory !== 'Todas'
  const hasSubcategory = selectedSubcategory !== 'Todas'
  const hasSort = sortBy !== 'recent'

  if (!hasSearch && !hasCategory && !hasSubcategory && !hasSort) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasSearch ? (
        <button
          type="button"
          onClick={onRemoveSearch}
          className="thsj-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition hover:border-(--line-strong)"
        >
          <span className="text-(--foreground-muted)">Busqueda:</span>
          <span className="max-w-36 truncate">{searchQuery}</span>
          <span className="text-(--foreground-muted)">✕</span>
        </button>
      ) : null}

      {hasCategory ? (
        <button
          type="button"
          onClick={onRemoveCategory}
          className="thsj-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition hover:border-(--line-strong)"
        >
          <span className="text-(--foreground-muted)">Categoria:</span>
          <span>{selectedCategory}</span>
          <span className="text-(--foreground-muted)">✕</span>
        </button>
      ) : null}

      {hasSubcategory ? (
        <button
          type="button"
          onClick={onRemoveSubcategory}
          className="thsj-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition hover:border-(--line-strong)"
        >
          <span className="text-(--foreground-muted)">Subcategoria:</span>
          <span>{selectedSubcategory}</span>
          <span className="text-(--foreground-muted)">✕</span>
        </button>
      ) : null}

      {hasSort ? (
        <button
          type="button"
          onClick={onRemoveSort}
          className="thsj-chip inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition hover:border-(--line-strong)"
        >
          <span className="text-(--foreground-muted)">Orden:</span>
          <span>{sortLabels[sortBy as Exclude<SortOption, 'recent'>]}</span>
          <span className="text-(--foreground-muted)">✕</span>
        </button>
      ) : null}
    </div>
  )
}
