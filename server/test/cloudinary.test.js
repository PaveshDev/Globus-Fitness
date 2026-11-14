import test from 'node:test'
import assert from 'node:assert/strict'
import { checksum, cloudPublicId, isCloudinaryUrl, uploadOriginal, uploadSignature, verifyCloudinaryOriginal } from '../src/services/cloudinaryService.js'

test('upload signatures are sorted and content-based IDs distinguish changed originals', () => {
  const signature = uploadSignature({ timestamp: '123', public_id: 'gym/photo', overwrite: 'false' }, 'test-secret')
  assert.equal(signature, uploadSignature({ overwrite: 'false', public_id: 'gym/photo', timestamp: '123' }, 'test-secret'))
  assert.notEqual(signature, uploadSignature({ timestamp: '123', public_id: 'gym/photo' }, 'test-secret'))
  assert.match(signature, /^[a-f0-9]{64}$/)
  assert.notEqual(cloudPublicId('Gym Logo.jpeg', checksum('original')), cloudPublicId('Gym Logo.jpeg', checksum('changed')))
})

test('delivery URL validation restricts scheme, host, account and credentials', () => {
  assert.equal(isCloudinaryUrl('https://res.cloudinary.com/gym/image/upload/v1/photo.jpg', 'gym'), true)
  for (const url of ['http://res.cloudinary.com/gym/image/upload/v1/photo.jpg', 'https://res.cloudinary.com.evil.example/gym/image/upload/v1/photo.jpg', 'https://user:pass@res.cloudinary.com/gym/image/upload/v1/photo.jpg', 'https://res.cloudinary.com/other/image/upload/v1/photo.jpg']) assert.equal(isCloudinaryUrl(url, 'gym'), false)
})

test('upload sends binary file bytes, keeps secret server-side, and verifies the downloaded original', async (t) => {
  const bytes = Buffer.from('original image bytes')
  const config = { cloudName: 'test-cloud', apiKey: 'test-key', apiSecret: 'test-secret' }
  const publicId = cloudPublicId('Gym Logo.jpeg', checksum(bytes))
  const delivery = `https://res.cloudinary.com/test-cloud/image/upload/v1/${publicId}.jpg`
  let uploads = 0
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.startsWith('https://api.cloudinary.com/')) {
      uploads += 1
      assert.equal(options.method, 'POST')
      assert.deepEqual(Buffer.from(await options.body.get('file').arrayBuffer()), bytes)
      assert.equal(options.body.has('api_secret'), false)
      assert.equal(options.body.get('overwrite'), 'false')
      assert.equal(options.body.get('signature'), uploadSignature({ overwrite: 'false', public_id: publicId, timestamp: options.body.get('timestamp') }, config.apiSecret))
      return Response.json({ public_id: publicId, asset_id: 'test-asset', secure_url: delivery })
    }
    assert.equal(url, delivery)
    return new Response(bytes)
  })
  const result = await uploadOriginal({ filename: 'Gym Logo.jpeg', data: bytes, mimeType: 'image/jpeg', config })
  assert.equal(uploads, 1)
  assert.equal(result.cloudUrl, delivery)
  assert.equal(result.sha256, checksum(bytes))
  assert.equal(JSON.stringify(result).includes(config.apiSecret), false)
})

test('failed or altered downloads never pass original verification', async (t) => {
  const url = 'https://res.cloudinary.com/gym/image/upload/v1/photo.jpg'
  t.mock.method(globalThis, 'fetch', async () => new Response('changed'))
  await assert.rejects(verifyCloudinaryOriginal(url, 'gym', checksum('original'), 8), /does not match/)
  await assert.rejects(verifyCloudinaryOriginal('https://evil.example/photo.jpg', 'gym', checksum('original'), 8), /Invalid Cloudinary/)
})
