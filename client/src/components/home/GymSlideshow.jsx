import { useEffect, useState, useCallback, useRef } from 'react'
import { gymSlides } from '../../data/gym.js'
import useReducedMotion from '../../hooks/useReducedMotion.js'
import GymImage from '../common/GymImage.jsx'
import Icon from '../common/Icon.jsx'

const SLIDE_INTERVAL = 4000 // 4 seconds per slide

export default function GymSlideshow() {
  const [active, setActive] = useState(0)
  const [slideProgressKey, setSlideProgressKey] = useState(0)
  const reducedMotion = useReducedMotion()
  const timerRef = useRef(null)

  const nextSlide = useCallback(() => {
    setActive((curr) => (curr + 1) % gymSlides.length)
    setSlideProgressKey((k) => k + 1)
  }, [])

  const prevSlide = useCallback(() => {
    setActive((curr) => (curr - 1 + gymSlides.length) % gymSlides.length)
    setSlideProgressKey((k) => k + 1)
  }, [])

  const selectSlide = useCallback((index) => {
    setActive((index + gymSlides.length) % gymSlides.length)
    setSlideProgressKey((k) => k + 1)
  }, [])

  // Continuous live slideshow timer
  useEffect(() => {
    if (reducedMotion) return

    timerRef.current = window.setInterval(() => {
      if (!document.hidden) {
        nextSlide()
      }
    }, SLIDE_INTERVAL)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [active, nextSlide, reducedMotion])

  return (
    <section
      className="gym-slideshow"
      aria-label="Inside Globus Fitness"
      aria-roledescription="carousel"
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') {
          event.preventDefault()
          nextSlide()
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault()
          prevSlide()
        }
      }}
    >
      <div className="slide-images">
        {gymSlides.map((slide, index) => (
          <div
            key={slide.src}
            className={`slide ${index === active ? 'is-active' : ''}`}
            aria-hidden={index !== active}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${gymSlides.length}`}
          >
            <GymImage
              src={slide.src}
              alt={slide.alt}
              width="1280"
              height="960"
              fetchPriority={index === 0 ? 'high' : 'auto'}
            />
          </div>
        ))}
        <div className="slide-overlay" aria-hidden="true" />
        <span className="photo-label">
          <span className="live-pulse-dot" aria-hidden="true" />
          LIVE &bull; INSIDE OUR GYM
        </span>
      </div>
      <div className="slideshow-bottom">
        <div className="slide-caption" aria-live="polite" aria-atomic="true">
          <span key={`lbl-${active}`} className="slide-caption-label">{gymSlides[active].label}</span>
          <p key={`ttl-${active}`} className="slide-caption-title">{gymSlides[active].title}</p>
        </div>
        <div className="slide-controls">
          <button
            type="button"
            className="icon-button"
            onClick={prevSlide}
            aria-label="Previous gym photo"
          >
            <Icon name="left" />
          </button>
          <span className="slide-count" aria-hidden="true">
            {String(active + 1).padStart(2, '0')} <span>/ {String(gymSlides.length).padStart(2, '0')}</span>
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={nextSlide}
            aria-label="Next gym photo"
          >
            <Icon name="right" />
          </button>
        </div>
      </div>
      <div className="slide-indicators" aria-label="Choose a gym photo">
        {gymSlides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            className={`indicator-btn ${index === active ? 'is-active' : ''}`}
            onClick={() => selectSlide(index)}
            aria-label={`Show gym photo ${index + 1}: ${slide.title}`}
            aria-pressed={index === active}
          >
            <span className="indicator-track">
              {index === active && !reducedMotion ? (
                <span
                  key={slideProgressKey}
                  className="indicator-fill"
                  style={{ animationDuration: `${SLIDE_INTERVAL}ms` }}
                />
              ) : (
                <span className={`indicator-static ${index === active ? 'is-current' : ''}`} />
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

