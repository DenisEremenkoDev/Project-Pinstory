// Mirrors backend/src/lib/upload.ts's ALLOWED map and 5 MB cap exactly.
// Shared between AddPlaceForm.tsx (client-side pre-validation) and
// places.mockRoutes.ts (server-side mock enforcement) so the two never drift.
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
