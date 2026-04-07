function roundInt(value: number) {
  return Math.max(0, Math.round(Number(value) || 0));
}

export function formatEstimatedTokens(value: number) {
  const amount = roundInt(value);
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return String(amount);
}
