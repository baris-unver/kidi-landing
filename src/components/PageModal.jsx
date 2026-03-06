import { useEffect } from 'react'
import { useSite } from '../context/SiteContext'

export default function PageModal() {
  const { content, modal, closeModal, settings, lang } = useSite()

  useEffect(() => {
    if (modal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [modal])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal])

  if (!modal || !content) return null

  const pageData = content[modal]
  if (!pageData) return null

  const logo = settings?.logo

  return (
    <div className="page-modal-overlay" onClick={closeModal}>
      <div className="page-modal" onClick={e => e.stopPropagation()}>
        <div className="page-modal-header">
          <div className="page-modal-logo">
            {logo?.imageUrl
              ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              : <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--primary)' }}>{logo?.text || 'kidi.ai'}</span>
            }
          </div>
          <button className="page-modal-close" onClick={closeModal} aria-label="Close">✕</button>
        </div>

        <div className="page-modal-body">
          <h1 className="page-modal-title">{pageData.title}</h1>
          {pageData.subtitle && <p className="page-modal-subtitle">{pageData.subtitle}</p>}

          {modal === 'contact' && (pageData.email || pageData.address || pageData.phone) && (
            <div className="page-modal-contact-cards">
              {pageData.email && (
                <a href={`mailto:${pageData.email}`} className="contact-card">
                  <span className="contact-card-icon">✉️</span>
                  <div>
                    <div className="contact-card-label">{lang === 'tr' ? 'E-posta' : 'Email'}</div>
                    <div className="contact-card-value">{pageData.email}</div>
                  </div>
                </a>
              )}
              {pageData.phone && (
                <a href={`tel:${pageData.phone}`} className="contact-card">
                  <span className="contact-card-icon">📞</span>
                  <div>
                    <div className="contact-card-label">{lang === 'tr' ? 'Telefon' : 'Phone'}</div>
                    <div className="contact-card-value">{pageData.phone}</div>
                  </div>
                </a>
              )}
              {pageData.address && (
                <div className="contact-card">
                  <span className="contact-card-icon">📍</span>
                  <div>
                    <div className="contact-card-label">{lang === 'tr' ? 'Adres' : 'Address'}</div>
                    <div className="contact-card-value">{pageData.address}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {pageData.body && (
            <div className="legal-content" dangerouslySetInnerHTML={{ __html: pageData.body }} />
          )}
        </div>
      </div>
    </div>
  )
}
