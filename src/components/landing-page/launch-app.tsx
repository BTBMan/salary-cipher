'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useConnection } from 'wagmi'
import { WalletSelectorDialog } from '@/components/dialogs/wallet-selector-dialog'
import { Button } from '@/components/ui/button'

export function LaunchApp() {
  const [open, setOpen] = useState(false)
  const { isConnected } = useConnection()
  const { push } = useRouter()

  const gotoDashboard = () => {
    push('/dashboard')
  }

  const handleLaunchApp = () => {
    if (isConnected) {
      gotoDashboard()
    }
    else {
      setOpen(true)
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          size="lg"
          className="w-full sm:w-auto px-8 py-7 text-base rounded-sm primary-gradient text-on-primary-container shadow-lg shadow-primary/20 hover:opacity-90 transition-all border-none font-bold"
          onClick={handleLaunchApp}
        >
          Launch APP
        </Button>
      </div>
      <WalletSelectorDialog open={open} setOpen={setOpen} onConnected={gotoDashboard} />
    </>
  )
}
