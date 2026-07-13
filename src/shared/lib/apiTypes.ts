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
  hope: 'Трогательно',
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
  isOwner: boolean
}

export interface UserSummaryDto {
  id: string
  displayName: string
  avatarUrl: string | null
}

export interface CollectionSummaryDto {
  id: string
  name: string
  description: string | null
  placesCount: number
}

export interface OwnCollectionDto extends CollectionSummaryDto {
  visibility: Visibility
  createdAt: string
  places: PlaceDto[]
}

export interface FollowedCollectionDto extends CollectionSummaryDto {
  owner: UserSummaryDto
}

export interface PlaceCommentDto {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  rating: number
  text: string
  createdAt: string
  isAuthor: boolean
}

export type FeedItemType = 'place_added' | 'wants_to_visit' | 'story_added'

export interface FeedItemDto {
  type: FeedItemType
  place: PlaceDto
  author: UserSummaryDto
  createdAt: string
}

// Live Yandex Geocoder pass-through — never persisted, never cached as a
// directory (map.md legal constraint). Only what the user explicitly saves
// becomes a Place.
export interface GeocodeResultDto {
  name: string
  address: string
  latitude: number
  longitude: number
}

export interface ProfileDto {
  user: {
    id: string
    email: string
    displayName: string
    avatarUrl: string | null
    bio: string | null
    status: string | null
    defaultVisibility: Visibility
    notificationsEnabled: boolean
  }
  placesCount: number
  followersCount: number
  followingCount: number
}
