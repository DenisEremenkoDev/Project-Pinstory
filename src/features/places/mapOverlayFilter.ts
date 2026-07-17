import type { PlaceDto } from '../../shared/lib/apiTypes'
import { hasVisited, isSamePlace } from './mapMatching'

export type OverlayFilter = 'all' | 'common' | 'own_only' | 'friend_only' | 'favorites' | 'common_want'

export interface OverlayFriendPin {
  place: PlaceDto
  shared: boolean
}

export interface OverlayView {
  own: PlaceDto[]
  friend: OverlayFriendPin[]
}

export function computeOverlayView(filter: OverlayFilter, own: PlaceDto[], friend: PlaceDto[]): OverlayView {
  const ownVisited = own.filter(hasVisited)
  const friendVisited = friend.filter(hasVisited)
  const sharedFriendPlaces = friendVisited.filter((fp) => ownVisited.some((op) => isSamePlace(op, fp)))
  const friendOnlyPlaces = friendVisited.filter((fp) => !ownVisited.some((op) => isSamePlace(op, fp)))

  // "хочу посетить" = no recommendation set yet (2026-07-16: "Запланировано"
  // collapsed into this bucket, so raw `status` is no longer the source of truth).
  const ownWantToVisit = own.filter((p) => p.myFeedback === null)
  const friendWantToVisit = friend.filter((p) => p.myFeedback === null)
  const commonWantToVisit = ownWantToVisit.filter((op) => friendWantToVisit.some((fp) => isSamePlace(op, fp)))
  const commonWantToVisitFriend = friendWantToVisit.filter((fp) => commonWantToVisit.some((op) => isSamePlace(op, fp)))

  switch (filter) {
    case 'common':
      return {
        own: ownVisited.filter((op) => sharedFriendPlaces.some((fp) => isSamePlace(op, fp))),
        friend: sharedFriendPlaces.map((place) => ({ place, shared: true })),
      }
    case 'own_only':
      return { own, friend: [] }
    case 'friend_only':
      return { own: [], friend: friendOnlyPlaces.map((place) => ({ place, shared: false })) }
    case 'favorites':
      return { own: own.filter((p) => p.myFeedback === 'like'), friend: [] }
    case 'common_want':
      return {
        own: commonWantToVisit,
        friend: commonWantToVisitFriend.map((place) => ({ place, shared: true })),
      }
    case 'all':
    default:
      return {
        own,
        friend: [
          ...sharedFriendPlaces.map((place) => ({ place, shared: true })),
          ...friendOnlyPlaces.map((place) => ({ place, shared: false })),
        ],
      }
  }
}
