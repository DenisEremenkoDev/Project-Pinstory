const GRADIENT_PALETTE: [string, string][] = [
  ['#A9CBC1', '#14B8A6'],
  ['#B6AEEA', '#4F46E5'],
  ['#CFE3DE', '#A9CBC1'],
  ['#D6D2F4', '#B6AEEA'],
  ['#E3AFA3', '#F59E0B'],
  ['#EADFCB', '#DCC9A3'],
  ['#F4D9D2', '#E3AFA3'],
]

export function gradientForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const [from, to] = GRADIENT_PALETTE[hash % GRADIENT_PALETTE.length]!
  return `linear-gradient(160deg, ${from}, ${to})`
}
