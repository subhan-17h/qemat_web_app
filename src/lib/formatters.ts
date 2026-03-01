export function formatPKR(amount: number) {
  return `Rs. ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount)}`;
}

export function sentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function googleMapsQuery(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
