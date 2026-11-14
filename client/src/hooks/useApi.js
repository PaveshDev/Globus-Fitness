import { useCallback, useEffect, useState } from 'react'
import { api } from '../services/api.js'

export default function useApi(path) {
  const [result, setResult] = useState({ data: null, error: '', loading: true, path })
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => { setResult((old) => ({ ...old, loading: true, error: '' })); setRevision((value) => value + 1) }, [])
  useEffect(() => {
    const controller = new AbortController()
    api(path, { signal: controller.signal }).then((data) => setResult({ data, error: '', loading: false, path })).catch((error) => {
      if (error.name !== 'AbortError') setResult({ data: null, error: error.message, loading: false, path })
    })
    return () => controller.abort()
  }, [path, revision])
  return { ...result, loading: result.loading || result.path !== path, reload }
}
