import { readdir, readFile, writeFile, rename } from 'node:fs/promises'
import { db } from '../config/database.js'
import { env } from '../config/env.js'
import { checksum, uploadOriginal, verifyCloudinaryOriginal } from './cloudinaryService.js'

export async function syncImages() {
  const directory = new URL('../../../Image/', import.meta.url)
  const manifest = {}
  let uploaded = 0
  const filenames = (await readdir(directory)).filter((filename) => /\.(jpe?g|png|webp|gif)$/i.test(filename)).sort()
  for (const filename of filenames) {
    const data = await readFile(new URL(encodeURIComponent(filename), directory))
    const sha256 = checksum(data)
    const mimeType = /\.png$/i.test(filename) ? 'image/png' : /\.webp$/i.test(filename) ? 'image/webp' : /\.gif$/i.test(filename) ? 'image/gif' : 'image/jpeg'
    const existing = await db.mediaAsset.findUnique({ where: { filename }, select: { cloudName: true, cloudUrl: true, cloudPublicId: true, cloudAssetId: true, sha256: true } })
    let cloud
    if (existing?.cloudUrl && existing.cloudPublicId && existing.cloudAssetId && existing.cloudName === env.cloudinary.cloudName && existing.sha256 === sha256) {
      await verifyCloudinaryOriginal(existing.cloudUrl, existing.cloudName, sha256, data.length)
      cloud = existing
    } else {
      cloud = await uploadOriginal({ filename, data, mimeType, config: env.cloudinary })
      uploaded += 1
    }
    // Only release legacy database bytes after the downloaded original passes SHA-256 verification.
    const values = { filename, mimeType, size: data.length, ...cloud, data: null }
    await db.mediaAsset.upsert({ where: { filename }, create: values, update: values })
    manifest[filename] = cloud.cloudUrl
    console.info(`Verified Cloudinary image: ${filename}`)
  }
  const target = new URL('../../../client/src/data/imageManifest.json', import.meta.url)
  const temporary = new URL(`${target.href}.tmp`)
  await writeFile(temporary, `${JSON.stringify(manifest, null, 2)}\n`)
  await rename(temporary, target)
  return { images: filenames.length, uploaded, verified: filenames.length }
}
