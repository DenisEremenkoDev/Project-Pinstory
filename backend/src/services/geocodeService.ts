import { createError } from '../middleware/errorHandler'

export interface GeocodeResult {
  name: string
  address: string
  latitude: number
  longitude: number
}

interface YandexGeoObject {
  name: string
  Point: { pos: string } // "longitude latitude", space-separated
  metaDataProperty: { GeocoderMetaData: { text: string } }
}

interface YandexGeocoderResponse {
  response: {
    GeoObjectCollection: {
      featureMember: Array<{ GeoObject: YandexGeoObject }>
    }
  }
}

const YANDEX_GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/'
const RESULTS_LIMIT = 5

// GET /geocode — live pass-through to the Yandex Geocoder HTTP API. Never
// persisted, never cached as a directory (map.md legal constraint); only
// what the caller explicitly saves later becomes a Place.
export async function searchGeocode(query: string): Promise<GeocodeResult[]> {
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY
  if (!apiKey) {
    throw createError(503, 'Геокодирование временно недоступно', 'GEOCODER_UNAVAILABLE')
  }

  const url = new URL(YANDEX_GEOCODER_URL)
  url.searchParams.set('apikey', apiKey)
  url.searchParams.set('geocode', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('results', String(RESULTS_LIMIT))

  const response = await fetch(url)
  if (!response.ok) {
    throw createError(502, 'Ошибка сервиса геокодирования', 'GEOCODER_ERROR')
  }

  const data = (await response.json()) as YandexGeocoderResponse | { error?: { message?: string } }

  // Yandex returns HTTP 200 even for some auth/quota failures, with a
  // different JSON shape (`{ error: { message } }`) instead of `response`.
  // Do NOT silently coerce that into an empty result list — it looks
  // identical to "no matches" and is impossible to diagnose later.
  if (!('response' in data) || !data.response?.GeoObjectCollection) {
    const upstreamMessage = 'error' in data ? data.error?.message : undefined
    console.error('Yandex Geocoder returned an unexpected response shape', upstreamMessage ?? data)
    throw createError(502, 'Ошибка сервиса геокодирования', 'GEOCODER_ERROR')
  }

  const members = data.response.GeoObjectCollection.featureMember

  return members.map(({ GeoObject }) => {
    // Yandex's Point.pos is "longitude latitude" — the same coordinate-order
    // trap documented in .claude/rules/map.md (ymaps3 uses [lng, lat] too).
    // Check this order every time; do not swap it accidentally.
    const [lngStr, latStr] = GeoObject.Point.pos.split(' ')
    return {
      name: GeoObject.name,
      address: GeoObject.metaDataProperty.GeocoderMetaData.text,
      latitude: Number(latStr),
      longitude: Number(lngStr),
    }
  })
}
