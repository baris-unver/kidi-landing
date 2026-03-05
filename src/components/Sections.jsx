import { useState } from 'react'
import { useSite } from '../context/SiteContext'
import useScrollReveal from '../hooks/useScrollReveal'

export function Features() {
  const { content, settings } = useSite()
  const ref = useScrollReveal()
  if (!content) return null
  const { features } = content
  return (
    <section className="features section" id="features" ref={ref}>
      <div className="container">
        <div className="section-header reveal">
          <h2>{features.title}</h2>
          <p>{features.subtitle}</p>
        </div>
        {settings?.featuresImage?.url && (
          <div className="features-showcase reveal">
            <img src={settings.featuresImage.url} alt={settings.featuresImage.alt || ''} />
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
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>{footer.copyright}</span>
          <span>Made with ❤️ for curious kids</span>
        </div>
      </div>
    </footer>
  )
}
