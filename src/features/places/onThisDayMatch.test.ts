import { describe, expect, it } from 'vitest'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { findOnThisDayMatches, yearsAgoLabel } from './onThisDayMatch'

function place(overrides: Partial<PlaceDto> & { id: string; createdAt: string }): PlaceDto {
  return {
    name: 'Кофейня у канала',
    latitude: 59.93,
    longitude: 30.35,
    rating: 4,
    note: null,
    photoUrl: null,
    tags: [],
    status: 'want_to_visit',
    visibility: 'public',
    mood: null,
    myFeedback: null,
    isOwner: true,
    ...overrides,
  }
}

describe('findOnThisDayMatches', () => {
  const today = new Date('2026-07-16T10:00:00.000Z')

  it('matches a place created on the same day/month in a previous year', () => {
    const p = place({ id: 'p1', createdAt: '2024-07-16T09:00:00.000Z' })
    expect(findOnThisDayMatches([p], today)).toEqual([{ place: p, years: 2 }])
  })

  it('does not match a place created today (this year)', () => {
    const p = place({ id: 'p1', createdAt: '2026-07-16T09:00:00.000Z' })
    expect(findOnThisDayMatches([p], today)).toEqual([])
  })

  it('does not match a different day or a different month', () => {
    const differentDay = place({ id: 'p1', createdAt: '2024-07-15T09:00:00.000Z' })
    const differentMonth = place({ id: 'p2', createdAt: '2024-08-16T09:00:00.000Z' })
    expect(findOnThisDayMatches([differentDay, differentMonth], today)).toEqual([])
  })

  it('handles a leap-day place on a non-leap "today" by simply not matching (Feb 29 has no Feb 29 in 2026)', () => {
    const leapDay = place({ id: 'p1', createdAt: '2024-02-29T09:00:00.000Z' })
    const notFeb29 = new Date('2026-03-01T10:00:00.000Z')
    expect(findOnThisDayMatches([leapDay], notFeb29)).toEqual([])
  })

  it('returns multiple matches, each with its own years-ago count', () => {
    const p1 = place({ id: 'p1', createdAt: '2024-07-16T09:00:00.000Z' })
    const p2 = place({ id: 'p2', createdAt: '2020-07-16T09:00:00.000Z' })
    expect(findOnThisDayMatches([p1, p2], today)).toEqual([
      { place: p1, years: 2 },
      { place: p2, years: 6 },
    ])
  })
})

describe('yearsAgoLabel', () => {
  it.each([
    [1, '1 год назад'],
    [2, '2 года назад'],
    [3, '3 года назад'],
    [4, '4 года назад'],
    [5, '5 лет назад'],
    [10, '10 лет назад'],
    [11, '11 лет назад'],
    [14, '14 лет назад'],
    [21, '21 год назад'],
    [22, '22 года назад'],
    [25, '25 лет назад'],
  ])('%i years -> "%s"', (years, label) => {
    expect(yearsAgoLabel(years)).toBe(label)
  })
})
