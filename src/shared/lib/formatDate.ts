const longRuDateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatLongRuDate(iso: string): string {
  return longRuDateFormatter.format(new Date(iso))
}
