'use client'

import { useAppKit } from '@reown/appkit/react'
import { ArrowRight, HelpCircle } from 'lucide-react'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { useBalance, useConnection } from 'wagmi'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  HubIcon,
  VerifiedIcon,
} from './icons'
import { WalletAddress } from './wallet-address'

export default function WalletConnection() {
  const [isOpen, setIsOpen] = useState(false)
  const { open } = useAppKit()
  const { address, isConnected } = useConnection()
  const { data } = useBalance({ address })

  const displayBalance = (balanceData: any) => {
    if (!balanceData)
      return '0'
    return `${Number.parseFloat(formatUnits(balanceData.value, balanceData.decimals)).toFixed(3)} ${balanceData.symbol}`
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end gap-0.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Vault Active</span>
          <span className="text-xs font-mono font-bold text-primary leading-none">{displayBalance(data)}</span>
        </div>
        <Button
          variant="outline"
          className="bg-surface-container border-white/5 hover:bg-surface-high h-10 px-4 rounded-sm transition-all"
          onClick={() => open()}
        >
          <WalletAddress address={address} className="bg-transparent p-0 text-xs" />
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={(
          <Button className="primary-gradient border-none font-bold gap-2 h-10 px-6 rounded-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
            <HubIcon className="size-4" />
            <span>Connect Vault</span>
          </Button>
        )}
      />

      <DialogContent className="max-w-md p-0 overflow-hidden bg-surface-container-low/90 backdrop-blur-2xl border-white/10 shadow-[0_40px_80px_-20px_rgba(6,14,32,0.8)] rounded-lg gap-0">
        {/* Connection UI 1:1 from HTML */}
        <div className="p-8">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center rounded-xl mb-4 border border-white/5 shadow-inner">
              <HubIcon className="text-primary size-10" />
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground mb-2">Salary Cipher</h2>
            <p className="text-muted-foreground font-medium text-sm">Sovereign Vault Access</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h3 className="font-heading text-xl font-semibold text-foreground">Connect your wallet to continue</h3>
              <p className="text-muted-foreground text-xs mt-1">Choose a provider to authenticate your cryptographic identity.</p>
            </div>

            <div className="space-y-3">
              {/* MetaMask Mock */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  open({ view: 'Connect' })
                }}
                className="w-full group flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-white/10 rounded-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#E2761B]/10 flex items-center justify-center rounded">
                    <div className="size-6 bg-[#E2761B] rounded-full opacity-80" />
                  </div>
                  <span className="font-semibold text-foreground">MetaMask</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>

              {/* WalletConnect */}
              <button
                onClick={() => {
                  setIsOpen(false)
                  open({ view: 'Connect' })
                }}
                className="w-full group flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-all duration-200 border border-transparent hover:border-white/10 rounded-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded">
                    <div className="size-6 bg-primary rounded-full opacity-80" />
                  </div>
                  <span className="font-semibold text-foreground">WalletConnect</span>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
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

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              New to Web3?
              <a className="text-primary hover:underline font-semibold ml-1 cursor-pointer">Learn about vaults</a>
            </p>
          </div>
        </div>

        <div className="p-4 bg-surface-container-lowest/30 border-t border-white/5 flex justify-between px-6">
          <button className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="size-3.5" />
            Support Center
          </button>
          <div className="flex gap-4">
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Privacy</button>
            <button className="text-xs font-semibold text-muted-foreground hover:text-foreground">Terms</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
