// Service layer for the real Yandex Maps JS API 3.0. Loaded lazily and only
// when VITE_YANDEX_MAPS_API_KEY is set (see mapsConfig.ts) — without a key
// the app keeps using the placeholder projection (mapProjection.ts).
// Components never touch the ymaps3 global directly; they call loadYmaps3().
import { yandexMapsApiKey } from './mapsConfig'

// The global `ymaps3` (created by the script tag below) is already declared
// by @yandex/ymaps3-types, pulled into the program via YandexMap.tsx.
let loadPromise: Promise<typeof ymaps3> | null = null

export function loadYmaps3(): Promise<typeof ymaps3> {
  if (!yandexMapsApiKey) {
    return Promise.reject(new Error('VITE_YANDEX_MAPS_API_KEY не задан'))
  }
  if (!loadPromise) {
    loadPromise = new Promise<typeof ymaps3>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://api-maps.yandex.ru/v3/?apikey=${yandexMapsApiKey}&lang=ru_RU`
      script.async = true
      script.onload = () => {
        ymaps3.ready.then(() => resolve(ymaps3)).catch((error: unknown) => {
          loadPromise = null // allow a retry after a failed init
          reject(error instanceof Error ? error : new Error(String(error)))
        })
      }
      script.onerror = () => {
        loadPromise = null // allow a retry after a network failure
        script.remove()
        reject(new Error('Не удалось загрузить Яндекс Карты'))
      }
      document.head.append(script)
    })
  }
  return loadPromise
}
