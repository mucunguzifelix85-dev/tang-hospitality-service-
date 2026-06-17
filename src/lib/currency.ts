export function formatRWF(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} RWF`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatDualPrice(rwf: number, usd: number): string {
  return `${formatRWF(rwf)} . ${formatUSD(usd)}`;
}
