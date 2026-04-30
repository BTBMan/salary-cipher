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
