export interface ApiErrorBody {
  error: {
    message: string
    code: string
  }
}

export type PlaceStatus = 'want_to_visit' | 'planned' | 'favorite'
export type Visibility = 'public' | 'private'
export type Sentiment = 'like' | 'dislike'

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
  createdAt: string
  myFeedback: Sentiment | null
}

export interface UserSummaryDto {
  id: string
  displayName: string
  avatarUrl: string | null
}
