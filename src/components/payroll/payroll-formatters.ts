export function formatTokenAmount(value: string | null, fallback = '••••••••') {
  if (!value) {
    return fallback
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value))
}

export function getBalanceShare(balance: string | null, total: string | null) {
  const balanceValue = Number(balance)
  const totalValue = Number(total)

  if (!Number.isFinite(balanceValue) || !Number.isFinite(totalValue) || totalValue <= 0) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((balanceValue / totalValue) * 100)))
}
