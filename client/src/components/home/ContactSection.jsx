import { whatsAppUrl } from '../../utils/whatsapp.js'
import ContactLink from '../common/ContactLink.jsx'
import Icon from '../common/Icon.jsx'

export default function ContactSection() {
  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <div className="container contact-grid">
        <div className="contact-copy">
          <p className="eyebrow">LET’S GET STARTED</p>
          <h2 id="contact-title">Your next chapter <br />starts at Globus.</h2>
        </div>
        <div className="contact-copy">
          <p>Questions about the gym, admission, or a membership? Get in touch with our admin on WhatsApp.</p>
          {whatsAppUrl ? <ContactLink>Chat on WhatsApp</ContactLink> : <>
            <button className="button button-primary" disabled aria-describedby="contact-status">Chat on WhatsApp<Icon name="chat" /></button>
            <p className="contact-status" id="contact-status">WhatsApp contact will be available soon.</p>
          </>}
        </div>
      </div>
    </section>
  )
}

