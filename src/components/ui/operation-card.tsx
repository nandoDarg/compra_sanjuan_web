'use client'

/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react'

type OperationCardProps = {
  postTitle: string
  postImageUrl: string | null
  counterpartyName: string
  counterpartyRoleLabel: string
  statusLabel: string
  statusTone?: 'neutral' | 'warning' | 'success' | 'danger'
  children?: ReactNode
}

const STATUS_TONE_CLASS: Record<NonNullable<OperationCardProps['statusTone']>, string> = {
  neutral: 'border-(--line-strong) bg-(--background-muted) text-(--foreground-muted)',
  warning: 'border-[#d97706] bg-[#fef3c7] text-[#92400e]',
  success: 'border-(--success) bg-[#dcfce7] text-(--success)',
  danger: 'border-red-200 bg-red-50 text-(--danger)',
}

export default function OperationCard({
  postTitle,
  postImageUrl,
  counterpartyName,
  counterpartyRoleLabel,
  statusLabel,
  statusTone = 'neutral',
  children,
}: OperationCardProps) {
  return (
    <article className="thsj-card flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-(--background-muted)">
        {postImageUrl ? (
          <img src={postImageUrl} alt={postTitle} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img src="/icon.svg" alt="" aria-hidden="true" className="h-8 w-8 opacity-40" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="line-clamp-1 font-semibold text-foreground">{postTitle}</p>
          <span
            className={[
              'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
              STATUS_TONE_CLASS[statusTone],
            ].join(' ')}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-(--foreground-muted)">
          {counterpartyRoleLabel}: <span className="font-medium text-foreground">{counterpartyName}</span>
        </p>

        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </article>
  )
}
