import { createContext, useContext, useState, useEffect } from 'react'

const SiteContext = createContext(null)

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

  // ── Content ────────────────────────────────────────
  const [content, setContent] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [contentRes, settingsRes] = await Promise.all([
          fetch(`/content/${lang}.json?t=${Date.now()}`),
          fetch(`/content/settings.json?t=${Date.now()}`)
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
      } catch (e) {
        console.error('Content load failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [lang])

  return (
    <SiteContext.Provider value={{ theme, toggleTheme, lang, toggleLang, content, settings, loading }}>
      {children}
    </SiteContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSite = () => useContext(SiteContext)
