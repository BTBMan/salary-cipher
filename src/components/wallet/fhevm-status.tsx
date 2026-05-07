'use client'

import type { FhevmGoState } from '@/hooks'
import { useFHEContext } from '@/hooks'
import { cn } from '@/utils'

const statusTone: Record<FhevmGoState, string> = {
  idle: 'bg-outline shadow-[0_0_8px_rgba(144,143,160,0.6)]',
  loading: 'bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.7)]',
  ready: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]',
  error: 'bg-destructive shadow-[0_0_8px_rgba(255,180,171,0.7)]',
}

const statusLabel: Record<FhevmGoState, string> = {
  idle: 'Idle',
  loading: 'Loading',
  ready: 'Ready',
  error: 'Error',
}

export function FhevmStatus() {
  const { error, status } = useFHEContext()

  return (
    <div
      className="hidden items-center gap-2 text-xs font-medium text-on-surface-variant md:flex"
      title={error?.message}
    >
      <div className={cn('h-2 w-2 animate-pulse rounded-full', statusTone[status])} />
      <span>
        Fhevm:
        {' '}
        {statusLabel[status]}
      </span>
    </div>
  )
}
