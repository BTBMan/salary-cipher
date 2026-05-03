import type { SettlementAssetOption } from '@/contexts'

export function getUnderlyingTokenSymbol(asset: Pick<SettlementAssetOption, 'symbol'> | null | undefined, fallback = 'USDC') {
  return asset?.symbol ?? fallback
}

export function getConfidentialTokenSymbol(asset: Pick<SettlementAssetOption, 'symbol'> | null | undefined, fallback = 'cUSDC') {
  return asset?.symbol ? `c${asset.symbol}` : fallback
}
