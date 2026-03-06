import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSite } from '../context/SiteContext'

const PAGE_KEYS = {
  terms: { emoji: '📋', fallbackTitle: 'Terms of Service' },
  privacy: { emoji: '🔒', fallbackTitle: 'Privacy Policy' },
  kvkk: { emoji: '🛡️', fallbackTitle: 'KVKK' },
}

export default function LegalPage() {
  const location = useLocation()
  const pageKey = location.pathname.replace('/', '')
  const { lang, toggleLang, settings } = useSite()
  const logo = settings?.logo
  const meta = PAGE_KEYS[pageKey]

  const isKvkk = pageKey === 'kvkk'
  const fetchLang = isKvkk ? 'tr' : lang

  const [legalData, setLegalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchedLang, setFetchedLang] = useState(null)

  if (fetchLang !== fetchedLang) {
    setFetchedLang(fetchLang)
    setLegalData(null)
    setLoading(true)
  }

  useEffect(() => {
    let stale = false
    fetch(`/content/legal-${fetchLang}.json`)
      .then(r => r.json())
      .then(data => { if (!stale) setLegalData(data) })
      .catch(() => { if (!stale) setLegalData(null) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [fetchLang])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
      🌟
    </div>
  )

  if (!meta) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <h1>Page not found</h1>
      <Link to="/" style={{ color: 'var(--primary)' }}>← Back to site</Link>
    </div>
  )

  const page = legalData?.[pageKey]
  const backLabel = lang === 'tr' ? '← Siteye dön' : '← Back to site'

  return (
    <>
      <nav className="legal-nav">
        <Link to="/" className="legal-nav-logo">
          {logo?.imageUrl
            ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            : <span>{logo?.text || 'kidi.ai'}</span>
          }
        </Link>
        {isKvkk ? (
          <span className="legal-only-badge">Yalnızca Türkçe</span>
        ) : (
          <div className="legal-lang-pill">
            <button className={lang === 'en' ? 'active' : ''} onClick={() => lang !== 'en' && toggleLang()}>EN</button>
            <button className={lang === 'tr' ? 'active' : ''} onClick={() => lang !== 'tr' && toggleLang()}>TR</button>
          </div>
        )}
        <Link to="/" className="legal-nav-back">{backLabel}</Link>
      </nav>

      <main className="legal-page-wrap">
        {page ? (
          <>
            <div className="legal-page-header">
              <div className="legal-page-badge">{meta.emoji} {page.badge || meta.fallbackTitle}</div>
              <h1 className="legal-page-title">{page.title}</h1>
              <div className="legal-page-meta">
                {page.effectiveDate && <span>{lang === 'tr' ? 'Yürürlük' : 'Effective'}: {page.effectiveDate}</span>}
                {page.lastUpdated && <span>{lang === 'tr' ? 'Son güncelleme' : 'Last updated'}: {page.lastUpdated}</span>}
              </div>
            </div>
            <div className="legal-content" dangerouslySetInnerHTML={{ __html: page.body }} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)' }}>
              {lang === 'tr' ? 'Bu sayfa henüz mevcut değil.' : 'This page is not yet available.'}
            </p>
          </div>
        )}
      </main>

      <footer className="legal-page-footer">
        <div className="legal-footer-logo">
          {logo?.imageUrl
            ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ height: 28, width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            : <span>{logo?.text || 'kidi.ai'}</span>
          }
        </div>
        <p>© {new Date().getFullYear()} APPFAB UYGULAMA FABRİKASI YAZILIM ANONİM ŞİRKETİ. {lang === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}</p>
        <div className="legal-footer-links">
          <Link to="/terms">{lang === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}</Link>
          <Link to="/privacy">{lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
          <Link to="/kvkk">KVKK</Link>
        </div>
      </footer>
    </>
  )
}
