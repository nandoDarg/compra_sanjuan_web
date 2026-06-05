type CategoryFilterProps = {
  categories: string[]
  selectedCategory: string
  onChange: (category: string) => void
  className?: string
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
  className,
}: CategoryFilterProps) {
  return (
    <div className={['flex gap-2 overflow-x-auto pb-1', className ?? ''].join(' ')}>
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
                ? 'border-(--brand-primary-strong) bg-(--brand-primary) text-white shadow-sm'
                : 'thsj-chip hover:border-(--line-strong) hover:bg-(--background-elevated)',
            ].join(' ')}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
