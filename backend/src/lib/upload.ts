import { randomBytes } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs'
import multer from 'multer'
import type { Request } from 'express'

// Local-disk storage for now. Kept behind this module so swapping to object
// storage later is a contained change and never leaks into route handlers
// (backend.md — "Photo storage behind an interface"). Ephemeral disk is a
// property of any host (backend.md §3), not one vendor's quirk.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads'

// Extension is validated against MIME; both must agree.
const ALLOWED: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
}

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Never trust the client's originalname. Generate the name; use the
    // MIME-derived extension, not the client-supplied one.
    const ext = ALLOWED[file.mimetype] ?? ''
    cb(null, `${randomBytes(16).toString('hex')}${ext}`)
  },
})

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  const mimeOk = file.mimetype in ALLOWED
  const extOk = Object.values(ALLOWED).includes(path.extname(file.originalname).toLowerCase())
  if (mimeOk && extOk) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

// Attached to the photo route ONLY (backend.md). Single field "photo", 5 MB cap.
export const photoUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('photo')

export function publicPhotoPath(filename: string): string {
  return `/${UPLOAD_DIR}/${filename}`
}
