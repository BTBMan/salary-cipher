import { useState } from 'react'
import {
  MdAutorenew as AutorenewIcon,
  MdVisibility as VisibilityIcon,
  MdVisibilityOff as VisibilityOffIcon,
} from 'react-icons/md'
import { cn } from '@/utils'

interface EncryptedFieldProps {
  canDecrypt?: boolean
  className?: string
  isEncrypted?: boolean
  isDecrypting?: boolean
  label?: string
  onDecrypt?: () => void
  value: string | number
  valueClassName?: string
}

export function EncryptedField({
  canDecrypt = false,
  className,
  isDecrypting = false,
  isEncrypted = true,
  label,
  onDecrypt,
  value,
  valueClassName,
}: EncryptedFieldProps) {
  const [locallyEncryptedValue, setLocallyEncryptedValue] = useState<string | null>(null)
  const hasDecryptedValue = !isEncrypted
  const isLocallyEncrypted = hasDecryptedValue && locallyEncryptedValue === String(value)
  const shouldMaskValue = isEncrypted || isLocallyEncrypted
  const canRequestDecrypt = canDecrypt && Boolean(onDecrypt)
  const canReveal = canRequestDecrypt || isLocallyEncrypted

  const handleReveal = () => {
    if (isLocallyEncrypted) {
      setLocallyEncryptedValue(null)
      return
    }

    onDecrypt?.()
  }

  if (!shouldMaskValue) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <div className="inline-flex max-w-full items-center gap-1">
          <div className={cn('font-mono text-sm', valueClassName)}>{value}</div>
          <button
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-outline transition-colors hover:bg-secondary/20 hover:text-tertiary"
            type="button"
            onClick={() => setLocallyEncryptedValue(String(value))}
          >
            <VisibilityOffIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <button
        className={cn(
          'group/encrypted-field relative inline-flex max-w-full items-center rounded px-1 text-left',
          canReveal ? 'cursor-pointer' : 'cursor-default',
        )}
        disabled={!canReveal || isDecrypting}
        type="button"
        onClick={handleReveal}
      >
        <div className={cn(
          'font-mono text-sm blur-sm select-none rounded bg-secondary/20 opacity-50 transition-all duration-300',
          valueClassName,
        )}
        >
          {hasDecryptedValue ? '••••••••' : value}
        </div>
        {isDecrypting && (
          <div className="absolute inset-0 flex items-center justify-center opacity-100">
            <AutorenewIcon className="h-3.5 w-3.5 animate-spin text-tertiary" />
          </div>
        )}
        {!isDecrypting && canReveal && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/encrypted-field:opacity-100">
            <VisibilityIcon className="h-3.5 w-3.5 text-tertiary" />
          </div>
        )}
      </button>
    </div>
  )
}
