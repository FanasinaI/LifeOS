export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 }).format(ratio);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
