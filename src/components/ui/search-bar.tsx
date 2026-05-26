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
      <span className="pointer-events-none absolute left-3 text-slate-400">⌕</span>
      <input
        value={localValue}
        onChange={(event) => setLocalValue(event.target.value)}
        placeholder="Buscar por titulo, descripcion o categoria..."
        className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
      />
    </label>
  )
}
