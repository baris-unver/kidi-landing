import { useState } from 'react'
import { useSite } from '../context/SiteContext'

const ICON_MESSAGE = (
  <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
    <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
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
