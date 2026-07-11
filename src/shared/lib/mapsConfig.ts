// Single switch point for swapping the placeholder map (mapProjection.ts)
// for real Yandex Maps once VITE_YANDEX_MAPS_API_KEY is set — mirrors the
// VITE_USE_MOCKS pattern in app/api.ts. No component should read
// import.meta.env directly; go through this file instead (CLAUDE.md:
// external APIs live behind a dedicated service layer).
export const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined
export const hasRealMapsKey = Boolean(yandexMapsApiKey)
