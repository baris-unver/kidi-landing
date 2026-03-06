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

export function Footer() {
  const { content, settings } = useSite()
  if (!content) return null
  const { footer } = content
  const logo = settings?.logo
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="nav-logo">
              {logo?.imageUrl
                ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ width: logo.width || 120, filter: 'brightness(0) invert(1)' }} />
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
                    const isInternal = href.startsWith('/') && !href.startsWith('//')
                    return <li key={j}>{isInternal
                      ? <Link to={href}>{label}</Link>
                      : <a href={href}>{label}</a>
                    }</li>
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-legal-links">
          <Link to="/terms">{content.legal?.terms?.title || 'Terms of Service'}</Link>
          <Link to="/privacy">{content.legal?.privacy?.title || 'Privacy Policy'}</Link>
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
