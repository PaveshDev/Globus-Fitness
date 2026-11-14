import { Link } from 'react-router'
import { admissionFee, formatPrice, membershipPlans } from '../../data/gym.js'
import Icon from '../common/Icon.jsx'

export default function MembershipSection() {
  return (
    <section id="membership" className="section membership-section" aria-labelledby="membership-title">
      <div className="container">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR MEMBERSHIP</p><h2 id="membership-title">A plan for your pace.</h2></div>
          <p>A month to get started or a year to keep going.<br className="desktop-break" /> Choose the time that works for you.</p>
        </div>
        <div className="admission-row">
          <span className="admission-icon"><Icon name="strength" /></span>
          <div><h3>Admission fee</h3><p>Listed separately from your membership plan.</p></div>
          <strong>{formatPrice(admissionFee)}</strong>
        </div>
        <div className="plans-grid">
          {membershipPlans.map((plan) => (
            <article className="plan-card" key={plan.id}>
              <span className="plan-duration">{plan.period.toUpperCase()}</span>
              <h3>{plan.title}</h3>
              <p className="plan-price">{formatPrice(plan.price)}</p>
              <span className="plan-period">for {plan.period}</span>
              <p className="plan-description">{plan.description}</p>
              <Link to="/register" className="button button-plan" aria-label={`Register for the ${plan.title.toLowerCase()} plan`}>Register<Icon name="arrow" /></Link>
            </article>
          ))}
        </div>
        <p className="membership-note">Have a question about admission or payment? <a href="#contact">Get in touch with the gym.</a></p>
      </div>
    </section>
  )
}

