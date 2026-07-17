import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FeedItemDto } from '../../../shared/lib/apiTypes'
import { FeedPage } from './FeedPage'
import { useGetFeedQuery } from '../feedApi'
import { useCreatePlaceMutation, useGetPlacesQuery } from '../../places/placesApi'

vi.mock('../feedApi', () => ({
  useGetFeedQuery: vi.fn(),
}))

vi.mock('../../places/placesApi', async () => {
  const actual = await vi.importActual<typeof import('../../places/placesApi')>('../../places/placesApi')
  return { ...actual, useGetPlacesQuery: vi.fn(), useCreatePlaceMutation: vi.fn() }
})

const mockedUseGetFeedQuery = vi.mocked(useGetFeedQuery)
const mockedUseGetPlacesQuery = vi.mocked(useGetPlacesQuery)
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

async function openFriendsTab() {
  await userEvent.click(screen.getByRole('button', { name: 'От друзей' }))
}

describe('FeedPage — "От друзей" error handling', () => {
  beforeEach(() => {
    mockedUseGetPlacesQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never)
    mockedUseCreatePlaceMutation.mockReturnValue([vi.fn(), { isLoading: false }] as never)
  })

  it('shows a full-page error with retry when the initial load fails (no data yet)', async () => {
    const refetch = vi.fn()
    mockedUseGetFeedQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { status: 500, data: { error: { message: 'Сбой сервера' } } },
      refetch,
    } as never)

    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>,
    )
    await openFriendsTab()

    expect(screen.getByText('Не удалось загрузить')).toBeInTheDocument()
  })

  it('keeps showing already-loaded items when a "load more" fetch fails, instead of wiping them', async () => {
    const refetch = vi.fn()
    mockedUseGetFeedQuery.mockReturnValue({
      data: { items: [ITEM], nextCursor: 'cursor-2' },
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { data: { error: { message: 'Не удалось загрузить ещё' } } },
      refetch,
    } as never)

    render(
      <MemoryRouter>
        <FeedPage />
      </MemoryRouter>,
    )
    await openFriendsTab()

    expect(screen.getByText('Кофейня у канала')).toBeInTheDocument()
    expect(screen.queryByText('Не удалось загрузить')).not.toBeInTheDocument()
    expect(screen.getByText('Не удалось загрузить ещё')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }))
    expect(refetch).toHaveBeenCalled()
  })
})
