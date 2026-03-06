import { createContext, useContext, useState, useEffect } from 'react'

const SiteContext = createContext(null)

function setMeta(name, content, attr = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function applyMetaTags(content, settings) {
  const meta = content?.meta || {}
  const seo = settings?.seo || {}

  if (meta.title) document.title = meta.title
  if (seo.lang) document.documentElement.setAttribute('lang', seo.lang)

  setMeta('description', meta.description)
  setMeta('keywords', meta.keywords)
  setMeta('robots', seo.robots)

  if (seo.googleSiteVerification) {
    setMeta('google-site-verification', seo.googleSiteVerification)
  }

  const ogTitle = meta.ogTitle || meta.title
  const ogDesc = meta.ogDescription || meta.description
  setMeta('og:title', ogTitle, 'property')
  setMeta('og:description', ogDesc, 'property')
  setMeta('og:type', 'website', 'property')
  if (seo.siteUrl) setMeta('og:url', seo.siteUrl, 'property')
  if (seo.ogImage) setMeta('og:image', seo.ogImage, 'property')
  if (meta.title) setMeta('og:site_name', meta.title.split('—')[0]?.trim() || meta.title, 'property')

  setMeta('twitter:card', seo.ogImage ? 'summary_large_image' : 'summary', 'name')
  setMeta('twitter:title', ogTitle)
  setMeta('twitter:description', ogDesc)
  if (seo.ogImage) setMeta('twitter:image', seo.ogImage)
  if (seo.twitterHandle) setMeta('twitter:site', seo.twitterHandle)

  if (seo.siteUrl) {
    let link = document.querySelector('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', seo.siteUrl)
  }

  if (settings.favicon?.imageUrl) {
    let link = document.querySelector('link[rel="icon"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'icon')
      document.head.appendChild(link)
    }
    link.setAttribute('href', settings.favicon.imageUrl)
  }
}

export function SiteProvider({ children }) {
  // ── Theme ──────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kidi-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('kidi-theme', theme)
  }, [theme])

  // Listen to OS theme changes (only if user hasn't manually set)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      if (!localStorage.getItem('kidi-theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('kidi-theme', next)
  }

  // ── Language ───────────────────────────────────────
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('kidi-lang')
    if (saved) return saved
    const browser = navigator.language || navigator.userLanguage || 'en'
    return browser.toLowerCase().startsWith('tr') ? 'tr' : 'en'
  })

  const toggleLang = () => {
    const next = lang === 'en' ? 'tr' : 'en'
    setLang(next)
    localStorage.setItem('kidi-lang', next)
  }

  // ── Modal ────────────────────────────────────────
  const [modal, setModal] = useState(null)
  const openModal = (name) => setModal(name)
  const closeModal = () => setModal(null)

  // ── Content ────────────────────────────────────────
  const [content, setContent] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [contentRes, settingsRes] = await Promise.all([
          fetch(`/content/${lang}.json`),
          fetch(`/content/settings.json`)
        ])
        const [contentData, settingsData] = await Promise.all([
          contentRes.json(),
          settingsRes.json()
        ])
        setContent(contentData)
        setSettings(settingsData)

        // Apply brand colors from settings
        if (settingsData.brand) {
          const root = document.documentElement
          if (settingsData.brand.primaryColor) root.style.setProperty('--primary', settingsData.brand.primaryColor)
          if (settingsData.brand.accentColor) root.style.setProperty('--accent', settingsData.brand.accentColor)
          if (settingsData.brand.sunColor) root.style.setProperty('--sun', settingsData.brand.sunColor)
        }

        // Apply SEO meta tags
        applyMetaTags(contentData, settingsData)
      } catch (e) {
        console.error('Content load failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lang])

  return (
    <SiteContext.Provider value={{ theme, toggleTheme, lang, toggleLang, content, settings, loading, modal, openModal, closeModal }}>
      {children}
    </SiteContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSite = () => useContext(SiteContext)
