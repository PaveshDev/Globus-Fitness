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
            <div className="hero-footnote"><span />YOUR ROUTINE. YOUR PROGRESS.</div>
          </div>
          <GymSlideshow />
        </div>
      </section>
      <div className="training-strip">
        <div className="container training-strip-inner">
          <span><Icon name="strength" />Strength training</span>
          <span><Icon name="movement" />Cardio &amp; movement</span>
          <span><Icon name="time" />A routine that’s yours</span>
        </div>
      </div>
      <EquipmentSection />
      <MembershipSection />
      <JerseySection />
      <ContactSection />
    </>
  )
}

