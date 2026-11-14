import { formatPrice, jerseyProduct } from '../../data/gym.js'
import { createWhatsAppUrl } from '../../utils/whatsapp.js'
import GymImage from '../common/GymImage.jsx'
import Icon from '../common/Icon.jsx'
import JerseySizeChart from './JerseySizeChart.jsx'

const orderMessage = [
  'Hi Globus Fitness, I would like to order a ' + jerseyProduct.name + '.',
  'Price: ' + formatPrice(jerseyProduct.price) + ' per jersey.',
  'Please share the available sizes and size chart, and confirm availability and payment details.',
].join('\n')

const orderUrl = createWhatsAppUrl(import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER, orderMessage)

export default function JerseySection() {
  return (
    <section id="jersey" className="section jersey-section" aria-labelledby="jersey-title">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE GLOBUS KIT</p>
            <h2 id="jersey-title">The Globus gym jersey.</h2>
          </div>
          <div className="jersey-price">
            <strong>{formatPrice(jerseyProduct.price)}</strong>
            <span>per jersey</span>
          </div>
        </div>
        <a className="jersey-preview" href={jerseyProduct.image} target="_blank" rel="noopener noreferrer" aria-label="View full jersey image (opens in a new tab)">
          <GymImage src={jerseyProduct.image} alt="Full Globus Fitness Club jersey design: front and back views, front logo, back print, and sleeve details" width="1536" height="668" loading="lazy" decoding="async" />
          <span className="jersey-image-caption">View full-size image<Icon name="arrow" /><span className="sr-only"> (opens in a new tab)</span></span>
        </a>
        <div className="jersey-order-grid">
          <div className="jersey-details">
            <h3>Wear your club.</h3>
            <p>See the complete front and back design above, including the logo, print, and sleeve details. Open the image to take a closer look.</p>
            <details className="jersey-size-guide" open>
              <summary>Size guide</summary>
              <JerseySizeChart />
            </details>
          </div>
          <div className="jersey-order">
            <h3>Order directly with the gym.</h3>
            <p>Send an order request on WhatsApp. The admin will confirm your size, availability, and payment details.</p>
            {orderUrl ? (
              <a className="button button-primary" href={orderUrl} target="_blank" rel="noopener noreferrer" aria-describedby="jersey-order-note">
                Order on WhatsApp<Icon name="chat" /><span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <button className="button button-primary" disabled aria-describedby="jersey-order-status">
                Order on WhatsApp<Icon name="chat" />
              </button>
            )}
            <p className="jersey-order-note" id={orderUrl ? 'jersey-order-note' : 'jersey-order-status'}>
              {orderUrl ? 'Opens a message for you to review and send. Your order is confirmed by the admin.' : 'WhatsApp ordering will be available once the admin contact is added.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
