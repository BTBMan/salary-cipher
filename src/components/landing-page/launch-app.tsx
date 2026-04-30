'use client'

import { useRouter } from 'next/navigation'
import { startTransition, useEffect, useRef, useState } from 'react'
import { useConnection } from 'wagmi'
import { WalletSelectorDialog } from '@/components/dialogs/wallet-selector-dialog'
import { Button } from '@/components/ui/button'
import { useStoreContext } from '@/hooks'

export function LaunchApp() {
  const [open, setOpen] = useState(false)
  const [pendingLaunch, setPendingLaunch] = useState(false)
  const { isConnected } = useConnection()
  const { hasCompanies, isReady } = useStoreContext()
  const { push } = useRouter()
  const isConnectedRef = useRef(isConnected)

  useEffect(() => {
    isConnectedRef.current = isConnected
  }, [isConnected])

  // After the wallet connection finishes, route according to company state.
  useEffect(() => {
    if (!pendingLaunch || !isReady || !isConnected) {
      return
    }

    push(hasCompanies ? '/onboarding' : '/onboarding/create-company')
    startTransition(() => {
      setPendingLaunch(false)
    })
  }, [hasCompanies, isConnected, isReady, pendingLaunch, push])

  const handleLaunchApp = () => {
    if (isConnectedRef.current) {
      push(hasCompanies ? '/onboarding' : '/onboarding/create-company')
    }
    else {
      setPendingLaunch(true)
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
      <WalletSelectorDialog open={open} setOpen={setOpen} />
    </>
  )
}
