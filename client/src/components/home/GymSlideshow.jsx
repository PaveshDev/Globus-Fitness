import { useEffect, useState } from 'react'
import { gymSlides } from '../../data/gym.js'
import useReducedMotion from '../../hooks/useReducedMotion.js'
import GymImage from '../common/GymImage.jsx'
import Icon from '../common/Icon.jsx'

export default function GymSlideshow() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = useReducedMotion()
  const playing = !paused && !hovered && !reducedMotion

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((index) => (index + 1) % gymSlides.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [playing])

  function selectSlide(index) {
    setPaused(true)
    setActive((index + gymSlides.length) % gymSlides.length)
  }

  return (
    <section className="gym-slideshow" aria-label="Inside Globus Fitness" aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !event.target.closest('.playback')) setPaused(true)
      }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); selectSlide(active + 1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); selectSlide(active - 1) }
      }}>
      <div className="slide-images">
        {gymSlides.map((slide, index) => (
          <div key={slide.src} className={`slide ${index === active ? 'is-active' : ''}`} aria-hidden={index !== active} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${gymSlides.length}`}>
            <GymImage src={slide.src} alt={slide.alt} width="1280" height="960" fetchPriority={index === 0 ? 'high' : 'auto'} />
          </div>
        ))}
        <span className="photo-label"><span />INSIDE OUR GYM</span>
      </div>
      <div className="slideshow-bottom">
        <div className="slide-caption" aria-live={paused || reducedMotion ? 'polite' : 'off'} aria-atomic="true">
          <span>{gymSlides[active].label}</span>
          <p>{gymSlides[active].title}</p>
        </div>
        <div className="slide-controls">
          <button className="icon-button" onClick={() => selectSlide(active - 1)} aria-label="Previous gym photo"><Icon name="left" /></button>
          <span className="slide-count" aria-hidden="true">{String(active + 1).padStart(2, '0')} <span>/ 04</span></span>
          <button className="icon-button" onClick={() => selectSlide(active + 1)} aria-label="Next gym photo"><Icon name="right" /></button>
          <button className="icon-button playback" onClick={() => setPaused(!paused)} disabled={reducedMotion} aria-label={reducedMotion ? 'Autoplay off: reduced motion enabled' : paused ? 'Play slideshow' : 'Pause slideshow'}><Icon name={paused || reducedMotion ? 'play' : 'pause'} /></button>
        </div>
      </div>
      <div className="slide-indicators" aria-label="Choose a gym photo">
        {gymSlides.map((slide, index) => <button key={slide.src} className={index === active ? 'is-active' : ''} onClick={() => selectSlide(index)} aria-label={`Show gym photo ${index + 1}`} aria-pressed={index === active}><span /></button>)}
      </div>
    </section>
  )
}

