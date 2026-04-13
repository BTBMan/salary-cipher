'use client'

import type { Address } from 'viem'
import type { GetBalanceReturnType } from 'wagmi/actions'
import { useAppKit } from '@reown/appkit/react'
import { formatUnits } from 'viem'
import { useBalance, useConnection } from 'wagmi'
import { Button } from '@/components/ui/button'

function truncateAddress(address: Address) {
  return `${address.slice(0, 4)}...${address.slice(-6)}`
}

function displayBalance(balanceData: GetBalanceReturnType | undefined) {
  if (!balanceData)
    return '0'

  const { decimals, symbol, value } = balanceData
  return `${formatUnits(value, decimals)} ${symbol}`
}

export default function WalletConnection() {
  const { open } = useAppKit()
  const { address, isConnected } = useConnection()
  const { data } = useBalance({ address })

  return (
    <Button
      onClick={() => void open(isConnected ? undefined : { view: 'Connect' })}
    >
      {isConnected && address ? `${truncateAddress(address)} - ${displayBalance(data)}` : 'Connect Wallet'}
    </Button>
  )
}
