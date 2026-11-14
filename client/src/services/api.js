export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export async function api(path, { body, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options, credentials: 'include',
      headers: { 'X-Requested-With': 'GlobusFitness', ...(body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Unable to reach the gym service. Check your connection and try again.', { cause: error })
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw Object.assign(new Error(data.message || 'Something went wrong. Please try again.'), { status: response.status, fields: data.fields })
  return data
}

