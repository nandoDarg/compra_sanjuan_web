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
              'whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition',
              isActive
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50',
            ].join(' ')}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
