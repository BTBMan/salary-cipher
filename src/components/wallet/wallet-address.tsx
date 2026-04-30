import { useConnection } from 'wagmi'
import { cn } from '@/utils'

interface WalletAddressProps {
  address?: string
  className?: string
  full?: boolean
}

export function WalletAddress({ address, className, full = false }: WalletAddressProps) {
  const { address: walletAddress } = useConnection()
  address = address || walletAddress

  if (!address)
    return null

  const formattedAddress = full
    ? address
    : `${address.slice(0, 6)}...${address.slice(-4)}`

  return (
    <div className={cn(
      'font-mono text-sm py-1 bg-surface-high rounded-full text-foreground transition-colors inline-flex items-center gap-1.5',
      className,
    )}
    >
      {formattedAddress}
    </div>
  )
}
