'use client'

import { useAppKit } from '@reown/appkit/react'
import { LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import {
  MdArrowForward,
  MdVerified as VerifiedIcon,
} from 'react-icons/md'
import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import { WalletDisplay } from '@/components/wallet/wallet-display'
import { cn } from '@/utils'

interface WalletConnectionProps {
  direction?: 'vertical' | 'horizontal'
}

export function WalletConnection({ direction = 'vertical' }: WalletConnectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected, connector } = useConnection()
  const { mutate: disconnect } = useDisconnect()
  const { mutateAsync: connect } = useConnect()
  const connectors = useConnectors()

  const isVertical = direction === 'vertical'

  if (isConnected && address) {
    return (
      <>
        <WalletDisplay onClick={() => open()} />
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={(
          <Button className="text-sm">
            Connect Wallet
          </Button>
        )}
      />

      <DialogContent className="max-w-md p-0 overflow-hidden bg-surface-container-low/90 backdrop-blur-2xl border-white/10 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.8)] rounded-lg gap-0">
        <div className="p-8">
          <div className="flex flex-col items-center mb-10 text-center">
            <Logo className="w-16 h-16 mb-4 border border-white/5 shadow-inner" />
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground mb-2">Salary Cipher</h2>
            <p className="text-muted-foreground font-medium text-sm">Sovereign Vault Access</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-heading text-xl font-semibold text-foreground">Connect your wallet to continue</h3>
              <p className="text-muted-foreground text-xs mt-1">Choose a provider to authenticate your cryptographic identity.</p>
            </div>

            <div className="space-y-3">
              {connectors.map(connector => connector.icon && (
                <button
                  key={connector.uid}
                  onClick={async () => {
                    try {
                      await connect({ connector })
                      setIsOpen(false)
                    }
                    catch {
                      disconnect()
                    }
                  }}
                  className="w-full group flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-white/10 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <img src={connector.icon} alt={connector.name} className="w-9 h-9 rounded" />
                    <span className="font-semibold text-foreground">{connector.name}</span>
                  </div>
                  <MdArrowForward className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-start gap-3 p-4 bg-surface-container-lowest/50 rounded-lg">
                <VerifiedIcon className="text-tertiary size-5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[11px] text-foreground font-medium leading-relaxed">
                    All connections are processed via <span className="font-bold text-tertiary">Fully Homomorphic Encryption</span>.
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Your private keys are never exposed. Authentication happens on-chain within the Sovereign Vault.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              New to Web3?
              <a className="text-primary hover:underline font-semibold ml-1 cursor-pointer">Learn about vaults</a>
            </p>
          </div> */}
        </div>

        {/* <div className="p-4 bg-surface-container-lowest/30 border-t border-white/5 flex justify-between px-6">
          <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <MdHelpOutline className="size-3.5" />
            Support Center
          </button>
          <div className="flex gap-4">
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Privacy</button>
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Terms</button>
          </div>
        </div> */}
      </DialogContent>
    </Dialog>
  )
}
