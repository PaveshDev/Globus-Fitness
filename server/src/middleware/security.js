import { env } from '../config/env.js'
import { httpError } from '../utils/index.js'

export function security(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.path !== '/api/payments/payhere/notify') {
    // Fetch sends this header; cross-origin HTML forms cannot. CORS only allows our frontend.
    if (req.get('X-Requested-With') !== 'GlobusFitness' || (req.get('Origin') && req.get('Origin') !== env.clientOrigin)) {
      throw httpError(403, 'Request origin is not allowed.')
    }
  }
  next()
}

// Single-process limiter. Use a shared gateway/Redis limiter when scaling to multiple instances.
export function rateLimit(limit = 20, windowMs = 15 * 60_000) {
  const requests = new Map()
  const cleanup = setInterval(() => {
    for (const [key, entry] of requests) if (entry.reset <= Date.now()) requests.delete(key)
  }, windowMs)
  cleanup.unref()
  return (req, res, next) => {
    const key = req.ip
    let entry = requests.get(key)
    if (!entry || entry.reset <= Date.now()) {
      entry = { count: 0, reset: Date.now() + windowMs }
      requests.set(key, entry)
    }
    entry.count += 1
    if (entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.reset - Date.now()) / 1000))
      throw httpError(429, 'Too many attempts. Please try again later.')
    }
    next()
  }
}
