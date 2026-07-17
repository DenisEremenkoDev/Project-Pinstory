import type { PlaceDto } from '../../shared/lib/apiTypes'

export interface OnThisDayMatch {
  place: PlaceDto
  years: number
}

// Own places added on this calendar day in a previous year — pure so the
// date-matching edge cases (leap day, year boundaries) can be tested without
// mounting the component. Keep the UI dumb (map.md).
export function findOnThisDayMatches(places: PlaceDto[], today: Date): OnThisDayMatch[] {
  return places
    .map((place) => {
      const createdAt = new Date(place.createdAt)
      const sameDay = createdAt.getDate() === today.getDate() && createdAt.getMonth() === today.getMonth()
      const years = today.getFullYear() - createdAt.getFullYear()
      return sameDay && years > 0 ? { place, years } : null
    })
    .filter((match): match is OnThisDayMatch => match !== null)
}

export function yearsAgoLabel(years: number): string {
  const mod10 = years % 10
  const mod100 = years % 100
  if (mod100 >= 11 && mod100 <= 14) return `${years} лет назад`
  if (mod10 === 1) return `${years} год назад`
  if (mod10 >= 2 && mod10 <= 4) return `${years} года назад`
  return `${years} лет назад`
}
