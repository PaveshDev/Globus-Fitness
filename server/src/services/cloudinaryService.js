import { createHash } from 'node:crypto'

export const checksum = (data) => createHash('sha256').update(data).digest('hex')

export function uploadSignature(parameters, secret) {
  const serialized = Object.keys(parameters).sort().map((key) => `${key}=${parameters[key]}`).join('&')
  return createHash('sha256').update(serialized + secret).digest('hex')
}

export function cloudPublicId(filename, sha256) {
  const slug = filename.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `globus-fitness/${slug}-${sha256}`
}

export function isCloudinaryUrl(value, cloudName) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && !url.port && !url.username && !url.password &&
      /^[a-z0-9_-]+$/i.test(cloudName) && url.pathname.startsWith(`/${cloudName}/image/upload/`) && !url.search && !url.hash
  } catch { return false }
}

export async function verifyCloudinaryOriginal(url, cloudName, sha256, size) {
  if (!isCloudinaryUrl(url, cloudName)) throw new Error('Invalid Cloudinary delivery URL.')
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000), redirect: 'error' })
  if (!response.ok) throw new Error(`Cloudinary original could not be downloaded (HTTP ${response.status}).`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length !== size || checksum(bytes) !== sha256) throw new Error('Cloudinary original does not match the local file. Existing database image was preserved.')
}

export async function uploadOriginal({ filename, data, mimeType, config }) {
  if (!/^[a-z0-9_-]+$/i.test(config.cloudName) || !config.apiKey || !config.apiSecret) {
    throw new Error('Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server.')
  }
  const sha256 = checksum(data)
  const publicId = cloudPublicId(filename, sha256)
  const parameters = { overwrite: 'false', public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) }
  const form = new FormData()
  for (const [key, value] of Object.entries(parameters)) form.append(key, value)
  form.append('api_key', config.apiKey)
  form.append('signature', uploadSignature(parameters, config.apiSecret))
  // Upload the actual bytes; no remote-URL fetch or browser credentials are used.
  form.append('file', new Blob([data], { type: mimeType }), filename)
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(60_000), redirect: 'error',
  })
  if (!response.ok) {
    // Do not log raw provider errors: signature errors can contain signed request details.
    const error = await response.json().catch(() => ({}))
    const message = String(error.error?.message || '')
    const reason = /unknown api key|invalid api key/i.test(message) ? 'API key not recognized for this cloud' : /invalid signature/i.test(message) ? 'signature rejected; check the API secret' : /cloud name|cloud_name/i.test(message) ? 'cloud name not recognized' : 'check server credentials and account settings'
    throw new Error(`Cloudinary upload failed (HTTP ${response.status}; ${reason}).`)
  }
  const result = await response.json()
  if (result.public_id !== publicId || !result.asset_id || !isCloudinaryUrl(result.secure_url, config.cloudName)) {
    throw new Error('Cloudinary returned unexpected asset metadata.')
  }
  await verifyCloudinaryOriginal(result.secure_url, config.cloudName, sha256, data.length)
  return { cloudName: config.cloudName, cloudPublicId: publicId, cloudAssetId: result.asset_id, cloudUrl: result.secure_url, sha256 }
}
