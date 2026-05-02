// 1000 => $1,000.00
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    ...options,
  }).format(value)
}

// 1000 => $1.00k
export function formatNumberToShort(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...options,
  }).format(value)
}

// 1000 => 1000.00
export function formatDecimal(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', {
    notation: 'standard',
    compactDisplay: 'short',
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
    useGrouping: false,
    ...options,
  }).format(value)
}

const WHITESPACE_REGEX = /\s+/

// 0x1234567890abcdef => 0x1234...cdef
export function formatAddress(address: string, options?: { full?: boolean }) {
  if (options?.full) {
    return address
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Unix seconds => 01 Jan 2026
export function formatUnixDate(timestamp: number) {
  if (!timestamp) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp * 1000))
}

export function getAvatarFallback(displayName: string, fallbackSeed: string) {
  const parts = displayName.trim().split(WHITESPACE_REGEX).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return (parts[0]?.slice(0, 2) || fallbackSeed.slice(0, 2)).toUpperCase()
}
