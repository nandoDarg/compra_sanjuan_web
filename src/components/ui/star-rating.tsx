'use client'

type StarRatingProps = {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md'
  label?: string
}

const STAR_VALUES = [1, 2, 3, 4, 5]

/**
 * Estrellas 1-5. Si se pasa `onChange`, funciona como selector (botones);
 * si no, es de solo lectura (muestra `value`, admite decimales para promedios).
 */
export default function StarRating({ value, onChange, size = 'md', label }: StarRatingProps) {
  const isInteractive = Boolean(onChange)
  const starSizeClass = size === 'sm' ? 'text-base' : 'text-xl'

  return (
    <div className="inline-flex items-center gap-1" role={isInteractive ? 'radiogroup' : undefined} aria-label={label}>
      {STAR_VALUES.map((starValue) => {
        const filled = value >= starValue
        const partial = !filled && value > starValue - 1

        const amberClass = 'text-[#f59e0b]'
        const emptyClass = 'text-(--line-strong)'

        if (!isInteractive) {
          return (
            <span
              key={starValue}
              className={[starSizeClass, filled || partial ? amberClass : emptyClass].join(' ')}
              aria-hidden="true"
            >
              ★
            </span>
          )
        }

        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} estrella${starValue > 1 ? 's' : ''}`}
            onClick={() => onChange?.(starValue)}
            className={[
              starSizeClass,
              'transition hover:scale-110',
              filled ? amberClass : `${emptyClass} hover:text-(--foreground-muted)`,
            ].join(' ')}
          >
            ★
          </button>
        )
      })}
      {!isInteractive ? (
        <span className="ml-1 text-sm font-medium text-(--foreground-muted)">
          {value.toFixed(1)}
        </span>
      ) : null}
    </div>
  )
}
