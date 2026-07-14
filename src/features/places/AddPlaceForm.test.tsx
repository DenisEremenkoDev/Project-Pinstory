import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AddPlaceForm } from './AddPlaceForm'
import { useCreatePlaceMutation, useUploadPhotoMutation } from './placesApi'

vi.mock('./placesApi', () => ({
  useCreatePlaceMutation: vi.fn(),
  useUploadPhotoMutation: vi.fn(),
}))

const mockedUseCreatePlaceMutation = vi.mocked(useCreatePlaceMutation)
const mockedUseUploadPhotoMutation = vi.mocked(useUploadPhotoMutation)

function jpeg(name = 'photo.jpg', sizeBytes?: number): File {
  const content = sizeBytes ? [new ArrayBuffer(sizeBytes)] : ['fake-image-bytes']
  return new File(content, name, { type: 'image/jpeg' })
}

describe('AddPlaceForm — client-side photo validation', () => {
  beforeEach(() => {
    mockedUseCreatePlaceMutation.mockReturnValue([vi.fn(), { isLoading: false }] as never)
    mockedUseUploadPhotoMutation.mockReturnValue([vi.fn(), { isLoading: false }] as never)
    // jsdom has no createObjectURL/revokeObjectURL implementation.
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL = vi.fn()
  })

  it('accepts a valid JPEG under the size cap and shows a preview, with no error', async () => {
    render(<AddPlaceForm onSaved={vi.fn()} />)

    const input = screen.getByLabelText('Добавить фото')
    await userEvent.upload(input, jpeg())

    expect(screen.queryByText('Поддерживаются только JPEG, PNG и WebP')).not.toBeInTheDocument()
    expect(screen.queryByText('Файл слишком большой — максимум 5 МБ')).not.toBeInTheDocument()
    expect(screen.getByText('Нажмите, чтобы изменить')).toBeInTheDocument()
  })

  it('rejects a disallowed MIME type with the Russian error message', async () => {
    render(<AddPlaceForm onSaved={vi.fn()} />)

    const input = screen.getByLabelText('Добавить фото')
    const gif = new File(['fake-gif-bytes'], 'photo.gif', { type: 'image/gif' })
    // userEvent.upload enforces the input's `accept` attribute by default
    // (mimicking an OS file picker), so it would silently refuse to select a
    // mismatched-type file before the app ever sees it. `accept` is only a UI
    // hint though — nothing stops a user from picking a renamed/mismatched
    // file via "All files" — which is exactly the case the app's own MIME
    // check guards against, so bypass the picker-level filtering here.
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(input, gif)

    expect(screen.getByText('Поддерживаются только JPEG, PNG и WebP')).toBeInTheDocument()
    expect(screen.queryByText('Нажмите, чтобы изменить')).not.toBeInTheDocument()
  })

  it('rejects a file over 5 MB with the Russian error message', async () => {
    render(<AddPlaceForm onSaved={vi.fn()} />)

    const input = screen.getByLabelText('Добавить фото')
    const oversized = jpeg('big.jpg', 5 * 1024 * 1024 + 1)
    await userEvent.upload(input, oversized)

    expect(screen.getByText('Файл слишком большой — максимум 5 МБ')).toBeInTheDocument()
    expect(screen.queryByText('Нажмите, чтобы изменить')).not.toBeInTheDocument()
  })
})
