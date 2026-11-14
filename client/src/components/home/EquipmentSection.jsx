import { useState } from 'react'
import { equipment } from '../../data/gym.js'
import GymImage from '../common/GymImage.jsx'

const filters = ['Featured', 'All equipment', 'Strength', 'Cardio & core']

export default function EquipmentSection() {
  const [filter, setFilter] = useState('Featured')
  const visible = equipment.filter((item) => filter === 'All equipment' || (filter === 'Featured' ? item.featured : item.category === filter))

  return (
    <section id="equipment" className="section equipment-section" aria-labelledby="equipment-title">
      <div className="container">
        <div className="section-heading">
          <div><p className="eyebrow">THE EQUIPMENT</p><h2 id="equipment-title">Built for your next rep.</h2></div>
          <p>From your first warm-up to your final set.<br className="desktop-break" /> Take a closer look at what’s on our floor.</p>
        </div>
        <div className="equipment-filters" role="group" aria-label="Filter equipment">
          {filters.map((item) => <button key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <p className="sr-only" aria-live="polite">{visible.length} equipment items shown.</p>
        <div className="equipment-grid" key={filter}>
          {visible.map((item) => (
            <article className="equipment-card" key={item.id}>
              <div className="equipment-photo"><GymImage src={item.image} alt={item.alt} width="800" height="600" loading="lazy" decoding="async" /></div>
              <div className="equipment-copy"><span className="equipment-category">{item.category}</span><h3>{item.name}</h3><p>{item.description}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

