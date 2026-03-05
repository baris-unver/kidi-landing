import { useState } from 'react'
import { useSite } from '../context/SiteContext'

const WA_ICON = (
  <svg viewBox="0 0 32 32" fill="currentColor" width="28" height="28">
    <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.129 6.745 3.047 9.379L1.054 31.49l6.293-2.012A15.9 15.9 0 0 0 16.004 32C24.822 32 32 24.822 32 16S24.822 0 16.004 0zm9.35 22.614c-.393 1.107-1.943 2.025-3.2 2.293-.86.182-1.982.327-5.76-1.238-4.835-2.004-7.946-6.9-8.186-7.221-.232-.321-1.943-2.589-1.943-4.939 0-2.35 1.232-3.507 1.668-3.982.393-.429 1.036-.625 1.65-.625.196 0 .375.01.536.018.482.018.714.054 1.036.804.393.946 1.357 3.296 1.464 3.536.112.24.223.554.089.875-.125.321-.232.464-.464.732-.232.268-.446.473-.679.759-.214.25-.446.518-.196.964.25.446 1.125 1.857 2.411 3.007 1.661 1.482 3.054 1.946 3.5 2.161.339.161.75.125 1.011-.161.339-.375.75-.982 1.161-1.589.303-.429.679-.482 1.054-.321.375.143 2.393 1.129 2.804 1.339.411.214.679.321.786.5.107.179.107 1.036-.286 2.143z" />
  </svg>
)

export default function WhatsAppButton() {
  const { settings } = useSite()
  const [open, setOpen] = useState(false)

  const wa = settings?.whatsapp
  if (!wa?.enabled || !wa?.phoneNumber) return null

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
          : WA_ICON
        }
      </button>
    </>
  )
}
