import { useSite } from '../context/SiteContext'
import useScrollReveal from '../hooks/useScrollReveal'

export default function Hero() {
  const { content, settings } = useSite()
  const sectionRef = useScrollReveal()
  if (!content) return null
  const { hero } = content
  const heroImg = settings?.heroImage

  return (
    <section className="hero section" ref={sectionRef}>
      <div className="hero-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <div className={`container ${heroImg?.url ? 'hero-split' : ''}`}>
        <div className="hero-content">
          <div className="badge reveal">{hero.badge}</div>

          <h1 className="hero-title reveal">
            {hero.title}{' '}
            <span className="hero-title-accent">{hero.titleAccent}</span>
          </h1>

          <p className="hero-subtitle reveal">{hero.subtitle}</p>

          <div className="hero-actions reveal">
            <a href="#pricing" className="btn btn-primary">
              {hero.cta} →
            </a>
            <button className="btn btn-ghost">
              ▶ {hero.ctaSecondary}
            </button>
          </div>

          <div className="hero-trust reveal">
            <div className="avatar-stack">
              <span>SM</span>
              <span>MK</span>
              <span>PR</span>
            </div>
            <span>{hero.trustLine}</span>
          </div>
        </div>

        {(() => {
          const cards = (hero.floaterCards || []).filter(c => c.visible !== false)
          if (!cards.length) return null
          const floaters = cards.map((card, i) => (
            <div className="floater-card" key={i}>
              <span>{card.emoji}</span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>{card.value}</div>
                <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 600 }}>{card.label}</div>
              </div>
            </div>
          ))
          return heroImg?.url ? (
            <div className="hero-visual reveal">
              <img src={heroImg.url} alt={heroImg.alt || ''} className="hero-visual-img" />
              <div className="hero-floaters hero-floaters-over">{floaters}</div>
            </div>
          ) : (
            <div className="hero-floaters">{floaters}</div>
          )
        })()}
      </div>
    </section>
  )
}
