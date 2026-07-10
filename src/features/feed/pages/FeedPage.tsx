import { useState } from 'react'
import { PlaceDetailView } from '../../places/PlaceDetailView'
import { PlacesChronicle } from '../../places/PlacesChronicle'

export function FeedPage() {
  const [openPlaceId, setOpenPlaceId] = useState<string | null>(null)

  return (
    <div>
      <h1>Для вас</h1>

      <PlacesChronicle onOpenPlace={setOpenPlaceId} />

      {openPlaceId && (
        <PlaceDetailView placeId={openPlaceId} onClose={() => setOpenPlaceId(null)} />
      )}
    </div>
  )
}
