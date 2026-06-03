'use client'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export default function SearchBar({
  value,
  onChange,
}: SearchBarProps) {
  return (
    <label className="relative flex w-full items-center">
      <span className="pointer-events-none absolute left-3 text-(--foreground-muted)">⌕</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar por titulo, descripcion o categoria..."
        className="thsj-input w-full py-2.5 pl-9 pr-3 text-sm"
      />
    </label>
  )
}
