import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { FeedItemDto } from '../../shared/lib/apiTypes'
import { FeedItemCard } from './FeedItemCard'
import { useCreatePlaceMutation } from '../places/placesApi'

vi.mock('../places/placesApi', () => ({
  useCreatePlaceMutation: vi.fn(),
}))

const mockedNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => mockedNavigate }
})

const mockedUseCreatePlaceMutation = vi.mocked(useCreatePlaceMutation)

const ITEM: FeedItemDto = {
  type: 'place_added',
  createdAt: '2026-07-01T12:00:00.000Z',
  author: { id: 'author-1', displayName: 'Аня', avatarUrl: null },
  place: {
    id: 'place-1',
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
    createdAt: '2026-07-01T12:00:00.000Z',
    myFeedback: null,
    isOwner: false,
  },
}

describe('FeedItemCard', () => {
  it('shows an error message instead of failing silently when "Добавить к себе" fails', async () => {
    const unwrap = vi.fn().mockRejectedValue({ data: { error: { message: 'Место уже добавлено' } } })
    const createPlace = vi.fn().mockReturnValue({ unwrap })
    mockedUseCreatePlaceMutation.mockReturnValue([createPlace, { isLoading: false }] as never)

    render(
      <MemoryRouter>
        <FeedItemCard item={ITEM} onOpenPlace={() => {}} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Добавить к себе' }))

    expect(await screen.findByText('Место уже добавлено')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Добавить к себе' })).toBeEnabled()
  })

  it('shows "Добавлено" and disables the button after a successful add', async () => {
    const unwrap = vi.fn().mockResolvedValue(ITEM.place)
    const createPlace = vi.fn().mockReturnValue({ unwrap })
    mockedUseCreatePlaceMutation.mockReturnValue([createPlace, { isLoading: false }] as never)

    render(
      <MemoryRouter>
        <FeedItemCard item={ITEM} onOpenPlace={() => {}} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Добавить к себе' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Добавлено' })).toBeDisabled())
  })

  it('jumps to the map with the author as focusFriendId for a friend\'s place (isOwner: false)', async () => {
    mockedUseCreatePlaceMutation.mockReturnValue([vi.fn(), { isLoading: false }] as never)
    mockedNavigate.mockClear()

    render(
      <MemoryRouter>
        <FeedItemCard item={ITEM} onOpenPlace={() => {}} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }))

    expect(mockedNavigate).toHaveBeenCalledWith('/map', {
      state: { focusPlaceId: 'place-1', focusFriendId: 'author-1' },
    })
  })

  it('jumps to the map without focusFriendId for the viewer\'s own place (isOwner: true)', async () => {
    mockedUseCreatePlaceMutation.mockReturnValue([vi.fn(), { isLoading: false }] as never)
    mockedNavigate.mockClear()
    const ownItem: FeedItemDto = { ...ITEM, place: { ...ITEM.place, isOwner: true } }

    render(
      <MemoryRouter>
        <FeedItemCard item={ownItem} onOpenPlace={() => {}} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Показать на карте' }))

    expect(mockedNavigate).toHaveBeenCalledWith('/map', { state: { focusPlaceId: 'place-1' } })
  })
})
