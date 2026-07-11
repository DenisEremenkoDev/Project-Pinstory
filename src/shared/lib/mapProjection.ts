// Stand-in for real Yandex Maps geo-rendering until VITE_YANDEX_MAPS_API_KEY
// is available (see shared/lib/mapsConfig.ts). Projects lat/lng onto a fixed
// percentage-based viewport centered on Saint Petersburg, purely so pins can
// be positioned/clicked without a real map SDK. Swapping in the real map
// later only touches MapPage's rendering, not the surrounding data flow.
const CENTER = { latitude: 59.93, longitude: 30.35 }
const LAT_SPAN = 0.06
const LNG_SPAN = 0.1
const EDGE_PADDING_PERCENT = 8

function clampPercent(value: number): number {
  return Math.min(100 - EDGE_PADDING_PERCENT, Math.max(EDGE_PADDING_PERCENT, value))
}

export function projectToPercent(latitude: number, longitude: number): { top: number; left: number } {
  const top = 50 - ((latitude - CENTER.latitude) / LAT_SPAN) * 50
  const left = 50 + ((longitude - CENTER.longitude) / LNG_SPAN) * 50
  return { top: clampPercent(top), left: clampPercent(left) }
}

export function projectFromPercent(topPercent: number, leftPercent: number): { latitude: number; longitude: number } {
  const latitude = CENTER.latitude - ((topPercent - 50) / 50) * LAT_SPAN
  const longitude = CENTER.longitude + ((leftPercent - 50) / 50) * LNG_SPAN
  return { latitude, longitude }
}
