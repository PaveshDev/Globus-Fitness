export function errorHandler(error, _req, res, _next) {
  if (error.code === 'P2002') {
    return res.status(409).json({ message: 'These details are already registered or this request has already been submitted.' })
  }
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500

  res.status(status).json({
    message: status >= 500 ? 'The service is temporarily unavailable. Please try again.' : error.type === 'entity.parse.failed' ? 'Invalid JSON request.' : error.message || 'Invalid request.',
    ...(error.fields ? { fields: error.fields } : {}),
  })
}

