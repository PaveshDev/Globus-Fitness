import { httpError } from '../utils/index.js'

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== 'ADMIN') throw httpError(403, 'Administrator access is required.')
  next()
}

