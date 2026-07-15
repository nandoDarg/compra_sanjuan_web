'use client'

import {
  CATEGORY_TREE,
  getSubcategories,
  getTertiarySubcategories,
  resolveCategorySelection,
} from '@/lib/hierarchical-categories'

type CategoryIconBarProps = {
  selectedCategory: string
  selectedSubcategory: string
  onSelectCategory: (category: string) => void
  onSelectSubcategory: (category: string, subcategory: string) => void
  className?: string
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Vehiculos: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 11.5L7.5 6h9l2.5 5.5" />
      <rect x="2" y="11" width="20" height="7" rx="2" />
      <circle cx="7" cy="19.5" r="1.5" />
      <circle cx="17" cy="19.5" r="1.5" />
      <line x1="2" y1="15" x2="22" y2="15" />
    </svg>
  ),
  Inmuebles: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12L12 4l9 8" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  Servicios: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  Articulos: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
}

const ALL_ICON = (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

const ROOT_ITEMS = [
  { name: 'Todas', icon: ALL_ICON },
  ...CATEGORY_TREE.map((c) => ({ name: c.name, icon: CATEGORY_ICONS[c.name] ?? ALL_ICON })),
]

export default function CategoryIconBar({
  selectedCategory,
  selectedSubcategory,
  onSelectCategory,
  onSelectSubcategory,
  className,
}: CategoryIconBarProps) {
  // Mismo criterio de niveles que CategorySidebar (escritorio), pero
  // renderizado como chips horizontales en vez de lista vertical.
  const resolved =
    selectedCategory !== 'Todas' && selectedSubcategory !== 'Todas'
      ? resolveCategorySelection(selectedCategory, selectedSubcategory)
      : null

  const isAtRoot = selectedCategory === 'Todas'
  const isAtCategoryLevel = !isAtRoot && selectedSubcategory === 'Todas'
  const isAtSubcategoryLevel = !isAtRoot && !isAtCategoryLevel

  const resolvedSubcategory = resolved?.subcategory ?? null
  const isAtTertiary = Boolean(resolved?.tertiarySubcategory)
  const browsedSub = resolvedSubcategory ?? (isAtSubcategoryLevel ? selectedSubcategory : null)
  const tertiaryChildren = browsedSub ? getTertiarySubcategories(selectedCategory, browsedSub) : []

  const treeSubcategories = isAtCategoryLevel ? getSubcategories(selectedCategory) : []

  const chipClass = (isActive: boolean) =>
    [
      'thsj-chip shrink-0',
      isActive ? 'border-(--brand-primary) bg-(--brand-primary) text-white' : '',
    ].join(' ')

  return (
    <div className={className}>
      <div className="flex">
        {ROOT_ITEMS.map(({ name, icon }) => {
          const isActive = name === selectedCategory
          return (
            <button
              key={name}
              type="button"
              onClick={() => onSelectCategory(name)}
              aria-pressed={isActive}
              aria-label={name}
              className={[
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 px-0.5 text-center transition',
                isActive
                  ? 'text-(--brand-primary)'
                  : 'text-(--foreground-muted) hover:text-foreground',
              ].join(' ')}
            >
              {icon}
              <span className="text-[10px] font-semibold leading-tight tracking-tight">
                {name}
              </span>
              <span
                className={[
                  'h-0.5 w-4 rounded-full transition-all',
                  isActive ? 'bg-(--brand-primary)' : 'bg-transparent',
                ].join(' ')}
              />
            </button>
          )
        })}
      </div>

      {isAtCategoryLevel && treeSubcategories.length > 0 ? (
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onSelectSubcategory(selectedCategory, 'Todas')}
            className={chipClass(false)}
          >
            Todas
          </button>
          {treeSubcategories.map((sub) => (
            <button
              key={sub.name}
              type="button"
              onClick={() => onSelectSubcategory(selectedCategory, sub.name)}
              className={chipClass(false)}
            >
              {sub.name}
            </button>
          ))}
        </div>
      ) : null}

      {isAtSubcategoryLevel && !isAtTertiary && tertiaryChildren.length > 0 ? (
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onSelectSubcategory(selectedCategory, browsedSub!)}
            className={chipClass(false)}
          >
            Todas
          </button>
          {tertiaryChildren.map((tertiary) => (
            <button
              key={tertiary.name}
              type="button"
              onClick={() =>
                onSelectSubcategory(selectedCategory, `${browsedSub} > ${tertiary.name}`)
              }
              className={chipClass(false)}
            >
              {tertiary.name}
            </button>
          ))}
        </div>
      ) : null}

      {isAtTertiary && tertiaryChildren.length > 0 ? (
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => onSelectSubcategory(selectedCategory, browsedSub!)}
            className={chipClass(false)}
          >
            Todas
          </button>
          {tertiaryChildren.map((tertiary) => {
            const isActive = resolved?.tertiarySubcategory === tertiary.name
            return (
              <button
                key={tertiary.name}
                type="button"
                onClick={() =>
                  onSelectSubcategory(selectedCategory, `${browsedSub} > ${tertiary.name}`)
                }
                className={chipClass(isActive)}
              >
                {tertiary.name}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
