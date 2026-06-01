'use client'

import { useEffect, useState } from 'react'

type SearchBarProps = {
  value: string
  onDebouncedChange: (value: string) => void
  delayMs?: number
}

export default function SearchBar({
  value,
  onDebouncedChange,
  delayMs = 350,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onDebouncedChange(localValue.trim())
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, localValue, onDebouncedChange])

  return (
    <label className="relative flex w-full items-center">
      <span className="pointer-events-none absolute left-3 text-(--foreground-muted)">⌕</span>
      <input
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        placeholder="Buscar por titulo, descripcion o categoria..."
        className="thsj-input w-full py-2.5 pl-9 pr-3 text-sm"
      />
    </label>
  )
}
