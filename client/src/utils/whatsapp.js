// WhatsApp requires an international number without +, spaces, or punctuation.
export function createWhatsAppUrl(number, message = 'Hi Globus Fitness, I would like to know more about joining the gym.') {
  const digits = String(number || '').replace(/[+\s()-]/g, '')
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export const whatsAppUrl = createWhatsAppUrl(import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER)

