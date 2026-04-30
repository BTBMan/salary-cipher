import Jazzicon from '@raugfer/jazzicon'
import { useConnection } from 'wagmi'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { WalletAddress } from '@/components/wallet/wallet-address'

function buildDataUrl(address: string): string {
  return `data:image/svg+xml;base64,${btoa(Jazzicon(address))}`
}

interface WalletDisplayProps {
  onClick: () => void
}

export function WalletDisplay({ onClick }: WalletDisplayProps) {
  const { address } = useConnection()
  const imageUrl = buildDataUrl(address || '')

  return (
    <div className="flex items-center gap-3 bg-surface-container-lowest px-4 h-10 rounded-sm border border-white/5 hover:border-white/10 transition-colors cursor-pointer group" onClick={onClick}>
      <Avatar className="w-6 h-6 rounded-full bg-surface-bright ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
        <AvatarImage src={imageUrl} />
      </Avatar>
      <WalletAddress className="font-mono text-xs text-on-surface" />
    </div>
  )
}
