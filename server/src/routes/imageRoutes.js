import { Router } from 'express'
import { db } from '../config/database.js'
import { httpError } from '../utils/index.js'
import { isCloudinaryUrl } from '../services/cloudinaryService.js'

const router = Router()
router.get('/', async (_req, res) => {
  const images = await db.mediaAsset.findMany({ select: { filename: true, mimeType: true, size: true, sha256: true, cloudUrl: true }, orderBy: { filename: 'asc' } })
  res.json({ images: images.map(({ cloudUrl, ...image }) => ({ ...image, url: cloudUrl || `/api/images/${encodeURIComponent(image.filename)}` })) })
})
router.get('/:filename', async (req, res) => {
  const asset = await db.mediaAsset.findUnique({ where: { filename: req.params.filename } })
  if (!asset) throw httpError(404, 'Image not found.')
  if (asset.cloudUrl) {
    if (!isCloudinaryUrl(asset.cloudUrl, asset.cloudName)) throw httpError(503, 'Image storage is temporarily unavailable.')
    return res.set('Cache-Control', 'public, max-age=300').redirect(302, asset.cloudUrl)
  }
  if (!asset.data) throw httpError(404, 'Image not found.')
  res.set({ 'Content-Type': asset.mimeType, 'Cache-Control': 'public, max-age=3600', ETag: `"${asset.sha256}"` })
  if (req.fresh) return res.sendStatus(304)
  res.send(Buffer.from(asset.data))
})
export default router
