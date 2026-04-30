import { useEffect, useState } from 'react'
import { useConnection } from 'wagmi'
import { cn } from '@/utils'

const dotColors: Record<number, string> = {
  1: 'bg-eth-main shadow-[0_0_8px_var(--color-eth-main)]',
  11155111: 'bg-eth-sepolia shadow-[0_0_8px_var(--color-eth-sepolia)]',
  31337: 'bg-eth-local shadow-[0_0_8px_var(--color-eth-local)]',
}

export function WalletNetworkStatus() {
  const { chain } = useConnection()
  const [dotColor, setDotColor] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setDotColor(chain ? dotColors[chain!.id] : '')
  }, [chain])

  return (
    <div className="hidden md:flex items-center gap-2 text-xs font-medium text-on-surface-variant">
      <div className={cn('w-2 h-2 rounded-full animate-pulse', dotColor)} />
      <span>{chain?.name}</span>
    </div>
  )
}
