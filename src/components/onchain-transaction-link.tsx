'use client'

import type { Hex } from 'viem'
import { MdOpenInNew as OpenInNewIcon } from 'react-icons/md'
import { useConnection } from 'wagmi'
import { cn, formatAddress } from '@/utils'

const ETHERSCAN_TX_URL_BY_CHAIN_ID: Record<number, string> = {
  1: 'https://etherscan.io/tx',
  11155111: 'https://sepolia.etherscan.io/tx',
}

const LOCAL_CHAIN_IDS = new Set([31337, 1337])

function getTransactionUrl(chainId: number | undefined, transactionHash: Hex) {
  if (!chainId || LOCAL_CHAIN_IDS.has(chainId)) {
    return null
  }

  const baseUrl = ETHERSCAN_TX_URL_BY_CHAIN_ID[chainId]
  return baseUrl ? `${baseUrl}/${transactionHash}` : null
}

interface OnchainTransactionLinkProps {
  className?: string
  transactionHash: Hex
}

export function OnchainTransactionLink({ className, transactionHash }: OnchainTransactionLinkProps) {
  const { chainId } = useConnection()
  const transactionUrl = getTransactionUrl(chainId, transactionHash)
  const content = (
    <>
      {formatAddress(transactionHash)}
      {transactionUrl && <OpenInNewIcon className="size-3 opacity-60 group-hover/hash:opacity-100" />}
    </>
  )
  const baseClassName = cn(
    'font-mono text-[11px] font-bold text-outline transition-colors inline-flex items-center gap-2 group/hash',
    transactionUrl && 'hover:text-primary',
    className,
  )

  if (!transactionUrl) {
    return <span className={baseClassName}>{content}</span>
  }

  return (
    <a
      className={baseClassName}
      href={transactionUrl}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  )
}
