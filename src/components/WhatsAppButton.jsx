import { useState } from 'react'
import { useSite } from '../context/SiteContext'

const ICON_MESSAGE = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.42 1.3-1.96 1.38-.5.08-1.14.11-1.83-.11-.42-.14-.96-.34-1.65-.67-2.91-1.36-4.81-4.29-4.96-4.49-.14-.2-1.18-1.57-1.18-3 0-1.43.75-2.14 1.01-2.43.27-.29.58-.36.77-.36.2 0 .39 0 .56.01.18.01.42-.07.66.5.24.57.82 2.01.9 2.16.07.14.12.31.02.5-.1.19-.14.31-.29.47-.14.17-.3.37-.43.5-.14.14-.3.3-.13.58.18.29.78 1.29 1.67 2.08 1.15 1.03 2.12 1.35 2.42 1.5.3.14.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.14.5.22.57.34.07.12.07.68-.17 1.36z"/>
  </svg>
)

const ICON_PHONE = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1.003 1.003 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1v3.49c0 .55-.45 1-1 1C10.07 22 2 13.93 2 4.01c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.19z"/>
  </svg>
)

export default function WhatsAppButton() {
  const { settings } = useSite()
  const [open, setOpen] = useState(false)

  const wa = settings?.whatsapp
  if (!wa?.enabled || !wa?.phoneNumber) return null

  const icon = wa.icon === 'phone' ? ICON_PHONE : ICON_MESSAGE

  const phone = wa.phoneNumber.replace(/\D/g, '')
  const prefill = encodeURIComponent(wa.prefillMessage || '')
  const link = `https://wa.me/${phone}${prefill ? `?text=${prefill}` : ''}`
  const pos = wa.position === 'left' ? 'left' : 'right'

  const initials = (wa.agentName || 'S')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {open && (
        <div className={`wa-popup wa-pos-${pos}`}>
          <div className="wa-popup-header">
            <div className="wa-popup-header-info">
              {wa.agentPhoto
                ? <img className="wa-agent-photo" src={wa.agentPhoto} alt={wa.agentName} />
                : <div className="wa-agent-initials">{initials}</div>
              }
              <div>
                <div className="wa-agent-name">{wa.agentName || 'Support'}</div>
                <div className="wa-agent-status">Typically replies instantly</div>
              </div>
            </div>
            <button className="wa-popup-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>
          <div className="wa-popup-body">
            <div className="wa-bubble">
              <div className="wa-bubble-name">{wa.agentName || 'Support'}</div>
              {wa.welcomeMessage || 'Hi! How can we help you?'}
            </div>
          </div>
          <div className="wa-popup-footer">
            <a href={link} target="_blank" rel="noopener noreferrer" className="wa-start-btn">
              Start Chat
            </a>
          </div>
        </div>
      )}

      <button
        className={`wa-fab wa-pos-${pos}`}
        onClick={() => setOpen(!open)}
        aria-label="Chat on WhatsApp"
      >
        {open
          ? <span className="wa-fab-close">✕</span>
          : icon
        }
      </button>
    </>
  )
}
