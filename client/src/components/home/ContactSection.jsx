import { whatsAppUrl } from '../../utils/whatsapp.js'
import ContactLink from '../common/ContactLink.jsx'
import Icon from '../common/Icon.jsx'

const GYM_ADDRESS = '6R5R+R7V, 7, Akkaraipattu'
const MAP_QUERY = encodeURIComponent(GYM_ADDRESS)
const GOOGLE_MAPS_REDIRECT_URL = `https://www.google.com/maps/search/?api=1&query=${MAP_QUERY}`
const GOOGLE_MAPS_EMBED_URL = `https://maps.google.com/maps?q=${MAP_QUERY}&t=&z=16&ie=UTF8&iwloc=&output=embed`

export default function ContactSection() {
  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <div className="container">
        <div className="contact-heading">
          <p className="eyebrow">VISIT US &amp; GET IN TOUCH</p>
          <h2 id="contact-title">Find us in Akkaraipattu.</h2>
          <p className="contact-subtitle">
            Come put in the work at Globus Fitness Club. Visit our training facility in person, or get in touch with our team directly.
          </p>
        </div>

        <div className="location-grid">
          <div className="location-card">
            <div className="location-details">
              <div className="location-item">
                <span className="location-icon" aria-hidden="true">
                  <Icon name="mapPin" />
                </span>
                <div className="location-text">
                  <span className="location-label">Gym Address</span>
                  <strong className="location-value">{GYM_ADDRESS}</strong>
                  <span className="location-sub">Akkaraipattu, Eastern Province, Sri Lanka</span>
                </div>
              </div>

              <div className="location-item">
                <span className="location-icon" aria-hidden="true">
                  <Icon name="time" />
                </span>
                <div className="location-text">
                  <span className="location-label">Opening Hours</span>
                  <strong className="location-value">6:00 AM – 10:00 PM</strong>
                  <span className="location-sub">Open daily &bull; Monday through Sunday</span>
                </div>
              </div>

              <div className="location-item">
                <span className="location-icon" aria-hidden="true">
                  <Icon name="chat" />
                </span>
                <div className="location-text">
                  <span className="location-label">WhatsApp Inquiries</span>
                  <strong className="location-value">Member Support &amp; Admissions</strong>
                  <span className="location-sub">Direct assistance with admissions and memberships</span>
                </div>
              </div>
            </div>

            <div className="location-actions-group">
              <div className="location-actions">
                <a
                  href={GOOGLE_MAPS_REDIRECT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-primary"
                  aria-label={`Open location ${GYM_ADDRESS} in Google Maps`}
                >
                  <span>Open in Google Maps</span>
                  <Icon name="external" />
                </a>

                {whatsAppUrl ? (
                  <ContactLink className="button button-outline">
                    <span>Chat on WhatsApp</span>
                  </ContactLink>
                ) : (
                  <button
                    type="button"
                    className="button button-outline"
                    disabled
                    aria-describedby="contact-status"
                  >
                    <span>Chat on WhatsApp</span>
                    <Icon name="chat" />
                  </button>
                )}
              </div>

              {!whatsAppUrl && (
                <p className="contact-status" id="contact-status">
                  WhatsApp contact will be available soon.
                </p>
              )}
            </div>
          </div>

          <div className="location-map-wrapper">
            <div className="map-badge" aria-hidden="true">
              <span className="map-badge-dot" />
              <span>Globus Fitness &bull; {GYM_ADDRESS}</span>
            </div>
            <iframe
              className="location-iframe"
              title="Globus Fitness Club Location Map on Google Maps"
              src={GOOGLE_MAPS_EMBED_URL}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen=""
            />
          </div>
        </div>
      </div>
    </section>
  )
}

