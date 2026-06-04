'use client'

import { useEffect, useRef, useState } from 'react'

type SearchBarProps = {
  initialValue?: string
  onChange: (value: string) => void
}

export default function SearchBar({
  initialValue = '',
  onChange,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue)
  const prevInitialValue = useRef(initialValue)

  useEffect(() => {
    if (initialValue === '' && prevInitialValue.current !== '') {
      setValue('')
    }
    prevInitialValue.current = initialValue
  }, [initialValue])

  return (
    <label className="relative flex w-full items-center">
      <span className="pointer-events-none absolute left-3 text-(--foreground-muted)">⌕</span>
      <input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value
          setValue(nextValue)
          onChange(nextValue)
        }}
        placeholder="Buscar por titulo, descripcion o categoria..."
        className="thsj-input w-full py-2.5 pl-9 pr-3 text-sm"
      />
    </label>
  )
}
