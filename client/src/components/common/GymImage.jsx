import { useState } from 'react'

export default function GymImage({ src, alt, className = '', ...props }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className={`image-fallback ${className}`} role="img" aria-label={alt}><span>Photo unavailable</span></div>
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} {...props} />
}

