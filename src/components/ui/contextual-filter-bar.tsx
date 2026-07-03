import type { SortOption } from '@/lib/search/sort-option'

type ContextualFilterBarProps = {
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  selectedCondition: 'new' | 'used' | null
  onConditionChange: (value: 'new' | 'used' | null) => void
}

const CONDITIONS: Array<{ label: string; value: 'new' | 'used' | null }> = [
  { label: 'Todos', value: null },
  { label: 'Nuevo', value: 'new' },
  { label: 'Usado', value: 'used' },
]

export default function ContextualFilterBar({
  sortBy,
  onSortChange,
  selectedCondition,
  onConditionChange,
}: ContextualFilterBarProps) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <label className="relative shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="thsj-input appearance-none py-1.5 pl-2.5 pr-7 text-xs"
          aria-label="Ordenar resultados"
        >
          <option value="relevance">Más relevantes</option>
          <option value="recent">Más recientes</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-(--foreground-muted)">
          ▾
        </span>
      </label>

      <span className="h-4 w-px shrink-0 bg-(--line)" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Estado del artículo">
        {CONDITIONS.map(({ label, value }) => {
          const isActive = selectedCondition === value
          return (
            <button
              key={label}
              type="button"
              onClick={() => onConditionChange(isActive ? null : value)}
              aria-pressed={isActive}
              className={[
                'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                isActive
                  ? 'border-(--brand-primary) bg-(--brand-primary) text-white'
                  : 'thsj-chip hover:border-(--line-strong)',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
