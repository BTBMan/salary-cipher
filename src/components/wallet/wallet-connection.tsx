'use client'

import { useAppKit } from '@reown/appkit/react'
import { LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import { useConnection, useDisconnect } from 'wagmi'
import { WalletSelectorDialog } from '@/components/dialogs/wallet-selector-dialog'
import { Button } from '@/components/ui/button'
import { WalletDisplay } from '@/components/wallet/wallet-display'
import { cn } from '@/utils'

interface WalletConnectionProps {
  direction?: 'vertical' | 'horizontal'
}

export function WalletConnection({ direction = 'vertical' }: WalletConnectionProps) {
  const [open, setOpen] = useState(false)
  const { open: openAppKit } = useAppKit()
  const { address, isConnected, connector } = useConnection()
  const { mutate: disconnect } = useDisconnect()

  const isVertical = direction === 'vertical'

  if (isConnected && address) {
    return (
      <>
        <WalletDisplay onClick={() => openAppKit()} />
        <Button
          variant="ghost"
          className={
            cn('flex items-center gap-3 py-2.5 text-destructive/80 hover:text-destructive transition-colors font-semibold text-sm', isVertical ? 'w-full px-4 justify-start' : 'hover:bg-transparent')
          }
          size={isVertical ? 'default' : 'icon'}
          onClick={() => disconnect({ connector })}
        >
          <LogOutIcon className="size-5" />
          {isVertical && 'Disconnect'}
        </Button>
      </>

    )
  }

  return (
    <>
      <Button className="text-sm" onClick={() => setOpen(true)}>
        Connect Wallet
      </Button>
      <WalletSelectorDialog open={open} setOpen={setOpen} />
    </>
  )
}
