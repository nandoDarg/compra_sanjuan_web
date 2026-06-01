type CategoryFilterProps = {
  categories: string[]
  selectedCategory: string
  onChange: (category: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => {
        const isActive = selectedCategory === category

        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={[
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition',
              isActive
                ? 'border-[var(--brand-primary-strong)] bg-[var(--brand-primary)] text-white shadow-sm'
                : 'thsj-chip hover:border-[var(--line-strong)] hover:bg-[var(--background-elevated)]',
            ].join(' ')}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
