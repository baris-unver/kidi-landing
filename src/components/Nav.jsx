import { useState, useEffect } from 'react'
import { useSite } from '../context/SiteContext'

export default function Nav() {
  const { theme, toggleTheme, lang, toggleLang, content, settings } = useSite()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  if (!content) return null
  const { nav } = content
  const logo = settings?.logo

  const sectionMap = {
    '#features': 'features',
    '#how-it-works': 'howItWorks',
    '#pricing': 'pricing',
    '#faq': 'faq',
    '#testimonials': 'testimonials',
  }

  const visibleSections = settings?.sections || []
  const visibleIds = new Set(visibleSections.filter(s => s.visible).map(s => s.id))

  const filteredLinks = nav.links.filter(link => {
    const sectionId = sectionMap[link.href]
    if (!sectionId) return true
    if (visibleSections.length === 0) return true
    return visibleIds.has(sectionId)
  })

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            {logo?.imageUrl
              ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ width: logo.width || 120 }} />
              : <span>{logo?.text || 'kidi.ai'}</span>
            }
          </a>

          <ul className="nav-links">
            {filteredLinks.map(link => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button className="lang-toggle" onClick={toggleLang} aria-label="Switch language">
              {lang === 'en' ? 'TR' : 'EN'}
            </button>

            <button className="nav-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <a href="#pricing" className="btn btn-primary nav-cta-btn" style={{ padding: '10px 20px', fontSize: '14px' }}>
              {nav.cta}
            </a>

            <button
              className={`hamburger ${menuOpen ? 'open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      <div className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`} onClick={closeMenu} />
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        <ul className="mobile-menu-links">
          {filteredLinks.map(link => (
            <li key={link.href}>
              <a href={link.href} onClick={closeMenu}>{link.label}</a>
            </li>
          ))}
        </ul>
        <div className="mobile-menu-actions">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'en' ? 'TR' : 'EN'}
          </button>
          <button className="nav-icon-btn" onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <a href="#pricing" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={closeMenu}>
          {nav.cta}
        </a>
      </div>
    </>
  )
}
