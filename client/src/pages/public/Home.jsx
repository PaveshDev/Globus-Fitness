import GymSlideshow from '../../components/home/GymSlideshow.jsx'
import EquipmentSection from '../../components/home/EquipmentSection.jsx'
import MembershipSection from '../../components/home/MembershipSection.jsx'
import JerseySection from '../../components/home/JerseySection.jsx'
import ContactSection from '../../components/home/ContactSection.jsx'
import Icon from '../../components/common/Icon.jsx'

export default function Home() {
  return (
    <>
      <section id="gym" className="hero" aria-labelledby="home-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-line" />WELCOME TO GLOBUS FITNESS</p>
            <h1 id="home-title">Show up.<br /><span>Get stronger.</span></h1>
            <p className="hero-description">A space to put in the work. Find your rhythm, build your strength, and make every session count.</p>
            <div className="hero-actions">
              <a href="#membership" className="button button-primary">View memberships<Icon name="arrow" /></a>
              <a href="#equipment" className="button button-outline">Explore equipment</a>
            </div>
            <div className="hero-social-proof">
              <div className="social-proof-item">
                <div className="rating-badge" aria-label="4.9 star rating">
                  <span className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <Icon key={i} name="star" className="star-icon" />
                    ))}
                  </span>
                  <strong className="rating-value">4.9</strong>
                </div>
                <span className="social-proof-label">Member Rating</span>
              </div>
              <div className="social-proof-divider" aria-hidden="true" />
              <div className="social-proof-item">
                <strong className="stat-number">500+</strong>
                <span className="social-proof-label">Active Members</span>
              </div>
              <div className="social-proof-divider" aria-hidden="true" />
              <div className="social-proof-item">
                <strong className="stat-number">6AM – 10PM</strong>
                <span className="social-proof-label">Open Daily</span>
              </div>
            </div>
            <div className="hero-footnote"><span />YOUR ROUTINE. YOUR PROGRESS.</div>
          </div>
          <GymSlideshow />
        </div>
      </section>
      <div className="training-strip">
        <div className="container training-strip-inner">
          <a href="#equipment" className="feature-item">
            <span className="feature-icon"><Icon name="strength" /></span>
            <div className="feature-content">
              <h3>Strength training</h3>
              <p>Free weights, power racks &amp; plate-loaded gear</p>
            </div>
          </a>
          <a href="#equipment" className="feature-item">
            <span className="feature-icon"><Icon name="movement" /></span>
            <div className="feature-content">
              <h3>Cardio &amp; movement</h3>
              <p>Treadmills, bikes, rowers &amp; dynamic conditioning</p>
            </div>
          </a>
          <a href="#membership" className="feature-item">
            <span className="feature-icon"><Icon name="time" /></span>
            <div className="feature-content">
              <h3>A routine that’s yours</h3>
              <p>Flexible open hours, expert staff &amp; fair rates</p>
            </div>
          </a>
        </div>
      </div>
      <EquipmentSection />
      <MembershipSection />
      <JerseySection />
      <ContactSection />
    </>
  )
}

