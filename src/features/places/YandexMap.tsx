import { useEffect, useRef, useState } from 'react'
import type { YMap, YMapMarker } from '@yandex/ymaps3-types'
import type { PlaceDto } from '../../shared/lib/apiTypes'
import { loadYmaps3 } from '../../shared/lib/yandexMaps'
import { ErrorState } from '../../shared/ui/ErrorState'
import { Loader } from '../../shared/ui/Loader'
import type { MapLayer } from './MapPins'
import styles from './YandexMap.module.css'

// ymaps3 uses [longitude, latitude] order — the reverse of PlaceDto fields.
const SPB_CENTER: [number, number] = [30.35, 59.93]
const DEFAULT_ZOOM = 12

// The muted "parchment" basemap from the design system. Literal hex values
// (not CSS vars) because the map canvas can't read custom properties —
// they mirror --color-map-water / --color-map-land in tokens.css.
const BASEMAP_CUSTOMIZATION = [
  { tags: { any: ['water'] }, elements: 'geometry' as const, stylers: [{ color: '#DCEDEB' }] },
  { tags: { any: ['landscape', 'land'] }, elements: 'geometry' as const, stylers: [{ color: '#F1EFEA' }] },
]

interface YandexMapProps {
  layers: MapLayer[]
  selectedPlaceId: string | null
  onPinTap: (place: PlaceDto) => void
  onMapClick: (coords: { latitude: number; longitude: number }) => void
  myLocation?: { latitude: number; longitude: number } | null
}

function initialCenter(layers: MapLayer[]): [number, number] {
  const own = layers.find((layer) => layer.source === 'own')?.places ?? []
  const first = own[0]
  if (!first) return SPB_CENTER
  return [first.place.longitude, first.place.latitude]
}

export function YandexMap({ layers, selectedPlaceId, onPinTap, onMapClick, myLocation }: YandexMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<YMap | null>(null)
  const markersRef = useRef<YMapMarker[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [retryToken, setRetryToken] = useState(0)

  // Latest-callback refs so the map is created once and never re-initialized
  // just because a parent re-render produced new function identities.
  const onPinTapRef = useRef(onPinTap)
  const onMapClickRef = useRef(onMapClick)
  const initialLayersRef = useRef(layers)
  useEffect(() => {
    onPinTapRef.current = onPinTap
    onMapClickRef.current = onMapClick
  })

  useEffect(() => {
    let cancelled = false

    loadYmaps3()
      .then((maps) => {
        if (cancelled || !containerRef.current) return
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapListener } = maps

        const map = new YMap(containerRef.current, {
          location: { center: initialCenter(initialLayersRef.current), zoom: DEFAULT_ZOOM },
        })
        map.addChild(new YMapDefaultSchemeLayer({ customization: BASEMAP_CUSTOMIZATION }))
        map.addChild(new YMapDefaultFeaturesLayer({}))
        map.addChild(
          new YMapListener({
            layer: 'any',
            // onFastClick (not onClick): fires only for a genuine tap, so
            // panning/dragging the map never opens the add-place sheet.
            onFastClick: (object, event) => {
              if (object) return // a pin/feature was tapped — handled by the pin itself
              const [longitude, latitude] = event.coordinates
              onMapClickRef.current({ latitude, longitude })
            },
          }),
        )

        mapRef.current = map
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      markersRef.current = []
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [retryToken])

  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    for (const marker of markersRef.current) map.removeChild(marker)

    const placeMarkers = layers.flatMap((layer) =>
      layer.places.map(({ place, variant }) => {
        const element = document.createElement('button')
        element.type = 'button'
        element.className =
          layer.source === 'own'
            ? `${styles.pin} ${selectedPlaceId === place.id ? styles.pinSelected : ''}`
            : `${styles.friendPin} ${variant === 'shared' ? styles.friendPinShared : styles.friendPinOnly}`
        element.setAttribute('aria-label', place.name)
        element.onclick = (event) => {
          event.stopPropagation()
          onPinTapRef.current(place)
        }

        const marker = new ymaps3.YMapMarker(
          {
            coordinates: [place.longitude, place.latitude],
            // Friend overlay pins sit above own pins, per FRONTEND_INSTRUCTIONS §9.
            zIndex: layer.source === 'friend' ? 8 : 3,
          },
          element,
        )
        map.addChild(marker)
        return marker
      }),
    )

    const myLocationMarkers = myLocation
      ? [
          (() => {
            const element = document.createElement('div')
            element.className = styles.myLocationDot
            element.setAttribute('aria-hidden', 'true')
            const marker = new ymaps3.YMapMarker(
              { coordinates: [myLocation.longitude, myLocation.latitude], zIndex: 10 },
              element,
            )
            map.addChild(marker)
            return marker
          })(),
        ]
      : []

    markersRef.current = [...placeMarkers, ...myLocationMarkers]
  }, [layers, selectedPlaceId, status, myLocation])

  // Recenter the camera when a fresh "my location" fix comes in — a location
  // object reference changes on every geolocation call, so this only fires
  // on an actual new fix, not on unrelated re-renders.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map || !myLocation) return
    map.setLocation({ center: [myLocation.longitude, myLocation.latitude], zoom: 15, duration: 300 })
  }, [myLocation, status])

  return (
    <div className={styles.map} onClick={(event) => event.stopPropagation()}>
      <div ref={containerRef} className={styles.map} />
      {status === 'loading' && (
        <div className={styles.stateOverlay}>
          <Loader />
        </div>
      )}
      {status === 'error' && (
        <div className={styles.stateOverlay}>
          <ErrorState
            title="Карта не загрузилась"
            description="Проверьте соединение и попробуйте ещё раз"
            onRetry={() => {
              setStatus('loading')
              setRetryToken((token) => token + 1)
            }}
          />
        </div>
      )}
    </div>
  )
}
