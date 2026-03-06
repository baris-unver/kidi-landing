import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import useScrollReveal from '../hooks/useScrollReveal'

export function Features() {
  const { content, settings } = useSite()
  const ref = useScrollReveal()
  const [activeIdx, setActiveIdx] = useState(0)
  if (!content) return null
  const { features } = content

  const images = settings?.featuresImages?.length
    ? settings.featuresImages.filter(img => img.url)
    : settings?.featuresImage?.url
      ? [settings.featuresImage]
      : []

  return (
    <section className="features section" id="features" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{features.title}</h2>
          <p>{features.subtitle}</p>
        </div>
        {images.length > 0 && (
          <div className="features-gallery reveal">
            <div className="features-gallery-main">
              <img src={images[activeIdx]?.url || images[0]?.url} alt={images[activeIdx]?.alt || ''} />
            </div>
            {images.length > 1 && (
              <div className="features-gallery-thumbs">
                {images.map((img, i) => (
                  <button key={i}
                    className={`features-gallery-thumb${i === activeIdx ? ' active' : ''}`}
                    onClick={() => setActiveIdx(i)}>
                    <img src={img.url} alt={img.alt || ''} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="features-grid">
          {features.items.map((item, i) => (
            <div className="feature-card reveal" key={i} style={{ transitionDelay: `${i * 0.08}s` }}>
              <span className="feature-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ParentApp() {
  const { content, settings } = useSite()
  const ref = useScrollReveal()
  const [activeIdx, setActiveIdx] = useState(0)
  if (!content) return null
  const pa = content.parentApp || {
    title: 'Stay Connected with Your Child\'s Journey',
    subtitle: 'Track your child\'s learning progress, achievements, and insights — all in the palm of your hand.',
    features: []
  }
  const screenshots = (settings?.parentApp?.screenshots || []).filter(s => s.url)
  const storeLinks = settings?.parentApp || {}

  return (
    <section className="section parent-app-section" id="parent-app" ref={ref}>
      <div className="container">
        <div className="parent-app-grid reveal">
          <div className="parent-app-phone-col">
            <div className="phone-mockup">
              <div className="phone-notch" />
              {screenshots.length > 0 ? (
                <img className="phone-screen" src={screenshots[activeIdx]?.url || screenshots[0]?.url} alt={screenshots[activeIdx]?.alt || ''} />
              ) : (
                <div className="phone-screen phone-screen-placeholder">
                  <span>📱</span>
                </div>
              )}
            </div>
            {screenshots.length > 1 && (
              <div className="phone-thumbs">
                {screenshots.map((s, i) => (
                  <button key={i}
                    className={`phone-thumb${i === activeIdx ? ' active' : ''}`}
                    onClick={() => setActiveIdx(i)}>
                    <img src={s.url} alt={s.alt || ''} />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="parent-app-content">
            <h2>{pa.title}</h2>
            {pa.subtitle && <p className="parent-app-subtitle">{pa.subtitle}</p>}
            {pa.features?.length > 0 && (
              <ul className="parent-app-features">
                {pa.features.map((f, i) => (
                  <li key={i}>
                    <span className="parent-app-feature-icon">{f.icon}</span>
                    <span>{f.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {(storeLinks.appStoreUrl || storeLinks.playStoreUrl) && (
              <div className="store-badges">
                {storeLinks.appStoreUrl && (
                  <a href={storeLinks.appStoreUrl} target="_blank" rel="noopener noreferrer">
                    {storeLinks.appStoreBadge
                      ? <img src={storeLinks.appStoreBadge} alt="Download on the App Store" className="store-badge-img" />
                      : <span className="store-badge-text">App Store</span>
                    }
                  </a>
                )}
                {storeLinks.playStoreUrl && (
                  <a href={storeLinks.playStoreUrl} target="_blank" rel="noopener noreferrer">
                    {storeLinks.playStoreBadge
                      ? <img src={storeLinks.playStoreBadge} alt="Get it on Google Play" className="store-badge-img" />
                      : <span className="store-badge-text">Google Play</span>
                    }
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  const { content } = useSite()
  const ref = useScrollReveal()
  if (!content) return null
  const { howItWorks } = content
  return (
    <section className="section" id="how-it-works" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{howItWorks.title}</h2>
          <p>{howItWorks.subtitle}</p>
        </div>
        <div className="steps-grid">
          {howItWorks.steps.map((step, i) => (
            <div className="step-card reveal" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              {step.image
                ? <img className="step-image" src={step.image} alt={step.title} />
                : <div className="step-number">{step.number || String(i + 1).padStart(2, '0')}</div>
              }
              <div className="step-badge">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Pricing() {
  const { content } = useSite()
  const ref = useScrollReveal()
  if (!content) return null
  const { pricing } = content
  return (
    <section className="pricing section" id="pricing" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{pricing.title}</h2>
          <p>{pricing.subtitle}</p>
        </div>
        <div className="pricing-grid">
          {pricing.plans.map((plan, i) => (
            <div className={`pricing-card reveal ${plan.highlighted ? 'highlighted' : ''}`} key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              {plan.highlighted && (
                <div className="pricing-popular-badge">⭐ {pricing.badge}</div>
              )}
              <div className="pricing-name">{plan.name}</div>
              <div className="pricing-price">
                {plan.price}
                <span className="pricing-price-period">{plan.period}</span>
              </div>
              <div className="pricing-desc">{plan.desc}</div>
              <ul className="pricing-features">
                {plan.features.map((f, j) => <li key={j}>{f}</li>)}
              </ul>
              <button className={`btn ${plan.highlighted ? 'btn-primary' : 'btn-ghost'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  const { content } = useSite()
  const ref = useScrollReveal()
  if (!content) return null
  const { testimonials } = content
  return (
    <section className="section" id="testimonials" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{testimonials.title}</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.items.map((t, i) => (
            <div className="testimonial-card reveal" key={i} style={{ transitionDelay: `${i * 0.1}s` }}>
              <p className="testimonial-quote">{t.quote}</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="testimonial-name">{t.author}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FAQ() {
  const { content } = useSite()
  const ref = useScrollReveal()
  const [open, setOpen] = useState(null)
  if (!content) return null
  const { faq } = content
  return (
    <section className="faq section" id="faq" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{faq.title}</h2>
        </div>
        <div className="faq-list reveal">
          {faq.items.map((item, i) => (
            <div className={`faq-item ${open === i ? 'open' : ''}`} key={i}>
              <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
                {item.q}
                <span className="faq-chevron">+</span>
              </button>
              <div className="faq-answer">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const MODAL_HREFS = { '#about': 'about', '#contact': 'contact' }

const SOCIAL_ICONS = {
  instagram: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  linkedin: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  facebook: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  tiktok: <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
}

export function Footer() {
  const { content, settings, lang, openModal } = useSite()
  if (!content) return null
  const { footer } = content
  const fl = settings?.footerLogo
  const hasFooterLogo = fl?.imageUrl || fl?.text
  const logo = hasFooterLogo ? fl : settings?.logo
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="nav-logo">
              {logo?.imageUrl
                ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ width: logo.width || 120, height: logo.height || 'auto', objectFit: 'contain' }} />
                : <span>{logo?.text || 'kidi.ai'}</span>
              }
            </div>
            <p className="footer-tagline">{footer.tagline}</p>
          </div>
          <div className="footer-cols">
            {footer.columns.map((col, i) => (
              <div key={i}>
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-col-links">
                  {col.links.map((link, j) => {
                    const label = typeof link === 'string' ? link : link.label
                    const href = typeof link === 'string' ? '#' : (link.href || '#')
                    const modalKey = MODAL_HREFS[href]
                    const isInternal = href.startsWith('/') && !href.startsWith('//')
                    return <li key={j}>{modalKey
                      ? <a href={href} onClick={e => { e.preventDefault(); openModal(modalKey) }}>{label}</a>
                      : isInternal
                        ? <Link to={href}>{label}</Link>
                        : <a href={href}>{label}</a>
                    }</li>
                  })}
                </ul>
              </div>
            ))}
            {footer.social?.length > 0 && (
              <div>
                <div className="footer-col-title">{lang === 'tr' ? 'Bizi Takip Edin' : 'Follow Us'}</div>
                <div className="footer-social-links">
                  {footer.social.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="footer-social-link" title={s.label}>
                      {SOCIAL_ICONS[s.platform] || <span>{s.label}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="footer-legal-links">
          <a href="#about" onClick={e => { e.preventDefault(); openModal('about') }}>{lang === 'tr' ? 'Hakkımızda' : 'About'}</a>
          <a href="#contact" onClick={e => { e.preventDefault(); openModal('contact') }}>{lang === 'tr' ? 'İletişim' : 'Contact'}</a>
          <Link to="/terms">{lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}</Link>
          <Link to="/privacy">{lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
          <Link to="/kvkk">KVKK</Link>
        </div>
        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          <span>Made with ❤️ for curious kids</span>
        </div>
      </div>
    </footer>
  )
}
