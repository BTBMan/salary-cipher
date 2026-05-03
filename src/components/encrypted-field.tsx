import {
  MdAutorenew as AutorenewIcon,
  MdVisibility as VisibilityIcon,
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
  const canRequestDecrypt = canDecrypt && Boolean(onDecrypt)

  if (!isEncrypted) {
    return (
      <div className={cn('space-y-1.5', className)}>
        {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
        <div className={cn('font-mono text-sm', valueClassName)}>{value}</div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <button
        className={cn(
          'group/encrypted-field relative inline-flex max-w-full items-center rounded px-1 text-left',
          canRequestDecrypt ? 'cursor-pointer' : 'cursor-default',
        )}
        disabled={!canRequestDecrypt || isDecrypting}
        type="button"
        onClick={onDecrypt}
      >
        <div className={cn(
          'font-mono text-sm blur-sm select-none rounded bg-secondary/20 opacity-50 transition-all duration-300',
          valueClassName,
        )}
        >
          {value}
        </div>
        {canRequestDecrypt && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/encrypted-field:opacity-100 transition-opacity">
            {isDecrypting
              ? <AutorenewIcon className="h-3.5 w-3.5 animate-spin text-tertiary" />
              : <VisibilityIcon className="h-3.5 w-3.5 text-tertiary" />}
          </div>
        )}
      </button>
    </div>
  )
}
