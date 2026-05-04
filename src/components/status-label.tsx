import { cn } from '@/utils'

export type StatusLabelStatus = 'Confirmed' | 'Deposited' | 'Requested' | 'Settled'

const statusClassNames: Record<StatusLabelStatus, { dot: string, label: string }> = {
  Confirmed: {
    dot: 'bg-tertiary',
    label: 'bg-tertiary/10 text-tertiary border-tertiary/20',
  },
  Deposited: {
    dot: 'bg-primary',
    label: 'bg-primary/10 text-primary border-primary/20',
  },
  Requested: {
    dot: 'bg-amber-400',
    label: 'bg-amber-400/10 text-amber-300 border-amber-400/20',
  },
  Settled: {
    dot: 'bg-emerald-400',
    label: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
}

interface StatusLabelProps {
  className?: string
  status: StatusLabelStatus
}

export function StatusLabel({ className, status }: StatusLabelProps) {
  const statusClassName = statusClassNames[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest',
        statusClassName.label,
        className,
      )}
    >
      <div className={cn('h-1.5 w-1.5 rounded-full', statusClassName.dot)} />
      {status}
    </span>
  )
}
