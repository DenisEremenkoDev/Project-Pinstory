import type { Place, Sentiment } from '@prisma/client'

// Wire shape (PlaceDto in the frontend's apiTypes.ts). Note: ownerId is NOT
// exposed — the DTO deliberately omits it. myFeedback and isOwner are computed
// per viewer, never stored (decisions.md D4).
export interface PlaceDto {
  id: string
  name: string
  latitude: number
  longitude: number
  rating: number
  note: string | null
  photoUrl: string | null
  tags: string[]
  status: Place['status']
  visibility: Place['visibility']
  mood: Place['mood']
  createdAt: string
  myFeedback: Sentiment | null
  isOwner: boolean
}

export function toPlaceDto(
  place: Place,
  viewerId: string | null,
  myFeedback: Sentiment | null,
): PlaceDto {
  return {
    id: place.id,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    rating: place.rating,
    note: place.note,
    photoUrl: place.photoUrl,
    tags: place.tags,
    status: place.status,
    visibility: place.visibility,
    mood: place.mood,
    createdAt: place.createdAt.toISOString(),
    myFeedback,
    isOwner: place.ownerId === viewerId,
  }
}
