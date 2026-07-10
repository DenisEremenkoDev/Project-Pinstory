export interface ApiErrorBody {
  error: {
    message: string
    code: string
  }
}

export type PlaceStatus = 'want_to_visit' | 'planned' | 'favorite'
export type Visibility = 'public' | 'private'
export type Sentiment = 'like' | 'dislike'
export type Mood = 'calm' | 'serenity' | 'hope' | 'laughter'

export const PLACE_STATUS_LABELS: Record<PlaceStatus, string> = {
  want_to_visit: 'Хочу посетить',
  planned: 'Запланировано',
  favorite: '★ Любимое',
}

export const MOOD_EMOJI: Record<Mood, string> = {
  calm: '😊',
  serenity: '😌',
  hope: '🥹',
  laughter: '😂',
}

export const MOOD_LABELS: Record<Mood, string> = {
  calm: 'Спокойствие',
  serenity: 'Умиротворение',
  hope: 'Надежда',
  laughter: 'Смех',
}

export interface PlaceDto {
  id: string
  name: string
  latitude: number
  longitude: number
  rating: number
  note: string | null
  photoUrl: string | null
  tags: string[]
  status: PlaceStatus
  visibility: Visibility
  mood: Mood | null
  createdAt: string
  myFeedback: Sentiment | null
}

export interface UserSummaryDto {
  id: string
  displayName: string
  avatarUrl: string | null
}
