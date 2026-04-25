'use client'

import { useState } from 'react'
import {
  MdLock as LockIcon,
  MdVisibility as VisibilityIcon,
} from 'react-icons/md'
import { cn } from '@/utils'

interface EncryptedFieldProps {
  value: string | number
  label?: string
  className?: string
  isEncrypted?: boolean
}

export function EncryptedField({ value, label, className, isEncrypted = true }: EncryptedFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false)

  if (!isEncrypted) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <div className="font-mono text-sm">{value}</div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <LockIcon className="h-3 w-3 text-tertiary" />
        </div>
      )}
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsRevealed(true)}
        onMouseLeave={() => setIsRevealed(false)}
        onClick={() => setIsRevealed(!isRevealed)}
      >
        <div className={cn(
          'font-mono text-sm transition-all duration-300',
          !isRevealed && 'blur-sm select-none opacity-50 bg-secondary/20 rounded px-1',
        )}
        >
          {value}
        </div>
        {!isRevealed && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <VisibilityIcon className="h-3.5 w-3.5 text-tertiary" />
          </div>
        )}
      </div>
    </div>
  )
}
