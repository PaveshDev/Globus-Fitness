import { whatsAppUrl } from '../../utils/whatsapp.js'
import Icon from './Icon.jsx'

export default function ContactLink({ children = 'Contact us', className = 'button button-primary', onClick }) {
  return (
    <a href={whatsAppUrl || '/#contact'} className={className} onClick={onClick} {...(whatsAppUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}<Icon name="chat" />
      {whatsAppUrl && <span className="sr-only"> on WhatsApp (opens in a new tab)</span>}
    </a>
  )
}

