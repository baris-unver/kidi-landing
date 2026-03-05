import { useState, useEffect, useRef } from 'react'
import { useSite } from '../context/SiteContext'

// ─── API helpers ─────────────────────────────────────────────────────────────
function getToken() {
  return sessionStorage.getItem('kidi-admin-token')
}

async function apiAuth(password) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Authentication failed')
  return data.token
}

async function apiSave(filePath, content, commitMessage) {
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ filePath, content, commitMessage }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Save failed')
  return data
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', rows }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {rows
        ? <textarea rows={rows} value={value || ''} onChange={e => onChange(e.target.value)} />
        : <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} />
      }
    </div>
  )
}

function ImageField({ label, value, onChange, previewSize = 80 }) {
  const ref = useRef()
  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target.result)
    reader.readAsDataURL(file)
  }
  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-image-upload">
        <div className="admin-image-preview" style={{ width: previewSize, height: previewSize }}>
          {value ? <img src={value} alt="" /> : '📷'}
        </div>
        <div className="admin-image-upload-btn">
          <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}
            onClick={() => ref.current.click()}>
            Upload image
          </button>
          {value && (
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13, color: '#ff4444' }}
              onClick={() => onChange('')}>
              Remove
            </button>
          )}
          <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
        <div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 11 }}>or paste URL</label>
            <input type="url" value={value || ''} onChange={e => onChange(e.target.value)}
              placeholder="https://..." style={{ fontSize: 13 }} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <div className="admin-color-row">
        <input type="color" value={value || '#FF6B35'} onChange={e => onChange(e.target.value)} />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="#FF6B35" style={{ fontFamily: 'monospace' }} />
      </div>
    </div>
  )
}

function ListItemHeader({ index, label, onRemove }) {
  return (
    <div style={{ padding: '16px 0 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>
        {label} {index + 1}
      </div>
      <button className="btn btn-ghost admin-remove-btn" onClick={onRemove} title="Remove">
        ✕
      </button>
    </div>
  )
}

function AddItemButton({ label, onClick }) {
  return (
    <button className="btn btn-ghost admin-add-btn" onClick={onClick}>
      + {label}
    </button>
  )
}

// ─── Section Ordering ────────────────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id: 'hero', visible: true },
  { id: 'features', visible: true },
  { id: 'howItWorks', visible: true },
  { id: 'pricing', visible: true },
  { id: 'testimonials', visible: true },
  { id: 'faq', visible: true },
]

const SECTION_LABELS = {
  hero: 'Hero',
  features: 'Features',
  howItWorks: 'How It Works',
  pricing: 'Pricing',
  testimonials: 'Testimonials',
  faq: 'FAQ',
}

function SectionOrderEditor({ sections, onChange }) {
  const items = sections?.length ? sections : DEFAULT_SECTIONS

  const move = (idx, dir) => {
    const next = [...items]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  const toggleVisible = (idx) => {
    const next = items.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s)
    onChange(next)
  }

  return (
    <div className="admin-card">
      <div className="admin-card-title">📐 Section Order & Visibility</div>
      <div className="admin-section-order-list">
        {items.map((s, i) => (
          <div key={s.id} className={`admin-section-order-item ${!s.visible ? 'disabled' : ''}`}>
            <div className="admin-section-order-arrows">
              <button onClick={() => move(i, -1)} disabled={i === 0} title="Move up">▲</button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down">▼</button>
            </div>
            <span className="admin-section-order-label">{SECTION_LABELS[s.id] || s.id}</span>
            <label className="admin-toggle">
              <input type="checkbox" checked={s.visible} onChange={() => toggleVisible(i)} />
              <span className="admin-toggle-slider" />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Section Editors ──────────────────────────────────────────────────────────
function SettingsEditor({ settings, onChange }) {
  const set = (path, val) => {
    const parts = path.split('.')
    const next = structuredClone(settings)
    let obj = next
    parts.slice(0, -1).forEach(k => {
      if (!obj[k]) obj[k] = {}
      obj = obj[k]
    })
    obj[parts[parts.length - 1]] = val
    onChange(next)
  }
  return (
    <>
      <SectionOrderEditor
        sections={settings.sections}
        onChange={v => set('sections', v)}
      />

      <div className="admin-card">
        <div className="admin-card-title">🎨 Logo</div>
        <Field label="Logo text (shown when no image)" value={settings.logo?.text}
          onChange={v => set('logo.text', v)} />
        <Field label="Logo width (px)" value={settings.logo?.width}
          onChange={v => set('logo.width', parseInt(v) || 120)} type="number" />
        <ImageField label="Logo image (optional — replaces text)" value={settings.logo?.imageUrl}
          onChange={v => set('logo.imageUrl', v)} previewSize={120} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🔖 Favicon</div>
        <ImageField label="Favicon (ICO, PNG, SVG — 32×32 recommended)"
          value={settings.favicon?.imageUrl}
          onChange={v => set('favicon.imageUrl', v)} previewSize={48} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Brand Colors</div>
        <ColorField label="Primary color" value={settings.brand?.primaryColor}
          onChange={v => set('brand.primaryColor', v)} />
        <ColorField label="Accent color" value={settings.brand?.accentColor}
          onChange={v => set('brand.accentColor', v)} />
        <ColorField label="Sun / highlight color" value={settings.brand?.sunColor}
          onChange={v => set('brand.sunColor', v)} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🔗 Social & Contact</div>
        <Field label="Contact email" value={settings.contact?.email}
          onChange={v => set('contact.email', v)} />
        <Field label="Twitter / X" value={settings.social?.twitter}
          onChange={v => set('social.twitter', v)} />
        <Field label="Instagram" value={settings.social?.instagram}
          onChange={v => set('social.instagram', v)} />
        <Field label="LinkedIn" value={settings.social?.linkedin}
          onChange={v => set('social.linkedin', v)} />
      </div>
    </>
  )
}

function ContentEditor({ content, onChange }) {
  const set = (path, val) => {
    const parts = path.split('.')
    const next = structuredClone(content)
    let obj = next
    parts.slice(0, -1).forEach(k => { obj = obj[k] })
    obj[parts[parts.length - 1]] = val
    onChange(next)
  }

  const setArr = (path, idx, key, val) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.forEach(k => { obj = obj[k] })
    obj[idx][key] = val
    onChange(next)
  }

  const addItem = (path, template) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.forEach(k => { obj = obj[k] })
    obj.push(template)
    onChange(next)
  }

  const removeItem = (path, idx) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.slice(0, -1).forEach(k => { obj = obj[k] })
    obj[parts[parts.length - 1]].splice(idx, 1)
    onChange(next)
  }

  const setPlanFeature = (planIdx, featIdx, val) => {
    const next = structuredClone(content)
    next.pricing.plans[planIdx].features[featIdx] = val
    onChange(next)
  }

  const addPlanFeature = (planIdx) => {
    const next = structuredClone(content)
    next.pricing.plans[planIdx].features.push('')
    onChange(next)
  }

  const removePlanFeature = (planIdx, featIdx) => {
    const next = structuredClone(content)
    next.pricing.plans[planIdx].features.splice(featIdx, 1)
    onChange(next)
  }

  const setFooterLink = (colIdx, linkIdx, val) => {
    const next = structuredClone(content)
    next.footer.columns[colIdx].links[linkIdx] = val
    onChange(next)
  }

  const addFooterLink = (colIdx) => {
    const next = structuredClone(content)
    next.footer.columns[colIdx].links.push('')
    onChange(next)
  }

  const removeFooterLink = (colIdx, linkIdx) => {
    const next = structuredClone(content)
    next.footer.columns[colIdx].links.splice(linkIdx, 1)
    onChange(next)
  }

  return (
    <>
      {/* Meta */}
      <div className="admin-card">
        <div className="admin-card-title">🔍 SEO / Meta</div>
        <Field label="Page title" value={content.meta?.title} onChange={v => set('meta.title', v)} />
        <Field label="Meta description" value={content.meta?.description}
          onChange={v => set('meta.description', v)} rows={2} />
      </div>

      {/* Nav */}
      <div className="admin-card">
        <div className="admin-card-title">🧭 Navigation</div>
        <Field label="CTA button text" value={content.nav?.cta} onChange={v => set('nav.cta', v)} />
        {content.nav?.links?.map((link, i) => (
          <div key={i}>
            <ListItemHeader index={i} label="Link" onRemove={() => removeItem('nav.links', i)} />
            <div className="admin-field-row">
              <Field label="Label" value={link.label} onChange={v => setArr('nav.links', i, 'label', v)} />
              <Field label="Href" value={link.href} onChange={v => setArr('nav.links', i, 'href', v)} />
            </div>
          </div>
        ))}
        <AddItemButton label="Add link" onClick={() => addItem('nav.links', { label: '', href: '#' })} />
      </div>

      {/* Hero */}
      <div className="admin-card">
        <div className="admin-card-title">🦸 Hero Section</div>
        <Field label="Badge text" value={content.hero?.badge} onChange={v => set('hero.badge', v)} />
        <div className="admin-field-row">
          <Field label="Title (first line)" value={content.hero?.title} onChange={v => set('hero.title', v)} />
          <Field label="Title accent word" value={content.hero?.titleAccent} onChange={v => set('hero.titleAccent', v)} />
        </div>
        <Field label="Subtitle" value={content.hero?.subtitle} onChange={v => set('hero.subtitle', v)} rows={2} />
        <div className="admin-field-row">
          <Field label="Primary CTA button" value={content.hero?.cta} onChange={v => set('hero.cta', v)} />
          <Field label="Secondary CTA button" value={content.hero?.ctaSecondary} onChange={v => set('hero.ctaSecondary', v)} />
        </div>
        <Field label="Trust line (below buttons)" value={content.hero?.trustLine} onChange={v => set('hero.trustLine', v)} />
      </div>

      {/* Features */}
      <div className="admin-card">
        <div className="admin-card-title">⭐ Features Section</div>
        <Field label="Section title" value={content.features?.title} onChange={v => set('features.title', v)} />
        <Field label="Section subtitle" value={content.features?.subtitle}
          onChange={v => set('features.subtitle', v)} rows={2} />
        {content.features?.items?.map((item, i) => (
          <div key={i}>
            <ListItemHeader index={i} label="Feature" onRemove={() => removeItem('features.items', i)} />
            <div className="admin-field-row">
              <Field label="Icon (emoji)" value={item.icon} onChange={v => setArr('features.items', i, 'icon', v)} />
              <Field label="Title" value={item.title} onChange={v => setArr('features.items', i, 'title', v)} />
            </div>
            <Field label="Description" value={item.desc} onChange={v => setArr('features.items', i, 'desc', v)} rows={2} />
          </div>
        ))}
        <AddItemButton label="Add feature" onClick={() => addItem('features.items', { icon: '✨', title: '', desc: '' })} />
      </div>

      {/* How It Works */}
      <div className="admin-card">
        <div className="admin-card-title">⚙️ How It Works</div>
        <Field label="Section title" value={content.howItWorks?.title} onChange={v => set('howItWorks.title', v)} />
        <Field label="Section subtitle" value={content.howItWorks?.subtitle} onChange={v => set('howItWorks.subtitle', v)} rows={2} />
        {content.howItWorks?.steps?.map((step, i) => (
          <div key={i}>
            <ListItemHeader index={i} label="Step" onRemove={() => removeItem('howItWorks.steps', i)} />
            <Field label="Title" value={step.title} onChange={v => setArr('howItWorks.steps', i, 'title', v)} />
            <Field label="Description" value={step.desc} onChange={v => setArr('howItWorks.steps', i, 'desc', v)} rows={2} />
          </div>
        ))}
        <AddItemButton label="Add step" onClick={() => addItem('howItWorks.steps', { number: String(content.howItWorks.steps.length + 1).padStart(2, '0'), title: '', desc: '' })} />
      </div>

      {/* Pricing */}
      <div className="admin-card">
        <div className="admin-card-title">💰 Pricing Section</div>
        <Field label="Section title" value={content.pricing?.title} onChange={v => set('pricing.title', v)} />
        <Field label="Section subtitle" value={content.pricing?.subtitle} onChange={v => set('pricing.subtitle', v)} />
        <Field label="Popular badge text" value={content.pricing?.badge} onChange={v => set('pricing.badge', v)} />
        {content.pricing?.plans?.map((plan, i) => (
          <div key={i}>
            <ListItemHeader index={i} label={`Plan: ${plan.name || ''}`} onRemove={() => removeItem('pricing.plans', i)} />
            <div className="admin-field-row">
              <Field label="Plan name" value={plan.name} onChange={v => setArr('pricing.plans', i, 'name', v)} />
              <Field label="Price" value={plan.price} onChange={v => setArr('pricing.plans', i, 'price', v)} />
            </div>
            <div className="admin-field-row">
              <Field label="Period (e.g. / month)" value={plan.period} onChange={v => setArr('pricing.plans', i, 'period', v)} />
              <Field label="CTA button text" value={plan.cta} onChange={v => setArr('pricing.plans', i, 'cta', v)} />
            </div>
            <Field label="Short description" value={plan.desc} onChange={v => setArr('pricing.plans', i, 'desc', v)} />
            <div className="admin-field">
              <label>Highlighted (popular)</label>
              <label className="admin-toggle" style={{ marginTop: 4 }}>
                <input type="checkbox" checked={!!plan.highlighted} onChange={e => setArr('pricing.plans', i, 'highlighted', e.target.checked)} />
                <span className="admin-toggle-slider" />
              </label>
            </div>
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Feature checklist</label>
              {plan.features?.map((feat, fi) => (
                <div key={fi} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="text" value={feat} onChange={e => setPlanFeature(i, fi, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)' }} />
                  <button className="btn btn-ghost admin-remove-btn" onClick={() => removePlanFeature(i, fi)} title="Remove">✕</button>
                </div>
              ))}
              <AddItemButton label="Add feature" onClick={() => addPlanFeature(i)} />
            </div>
          </div>
        ))}
        <AddItemButton label="Add plan" onClick={() => addItem('pricing.plans', { name: '', price: '', period: '', desc: '', features: [], cta: '', highlighted: false })} />
      </div>

      {/* Testimonials */}
      <div className="admin-card">
        <div className="admin-card-title">💬 Testimonials</div>
        <Field label="Section title" value={content.testimonials?.title} onChange={v => set('testimonials.title', v)} />
        {content.testimonials?.items?.map((t, i) => (
          <div key={i}>
            <ListItemHeader index={i} label="Testimonial" onRemove={() => removeItem('testimonials.items', i)} />
            <Field label="Quote" value={t.quote} onChange={v => setArr('testimonials.items', i, 'quote', v)} rows={2} />
            <div className="admin-field-row">
              <Field label="Name" value={t.author} onChange={v => setArr('testimonials.items', i, 'author', v)} />
              <Field label="Role / Label" value={t.role} onChange={v => setArr('testimonials.items', i, 'role', v)} />
            </div>
            <Field label="Avatar initials (2 chars)" value={t.avatar} onChange={v => setArr('testimonials.items', i, 'avatar', v)} />
          </div>
        ))}
        <AddItemButton label="Add testimonial" onClick={() => addItem('testimonials.items', { quote: '', author: '', role: '', avatar: '' })} />
      </div>

      {/* FAQ */}
      <div className="admin-card">
        <div className="admin-card-title">❓ FAQ</div>
        <Field label="Section title" value={content.faq?.title} onChange={v => set('faq.title', v)} />
        {content.faq?.items?.map((item, i) => (
          <div key={i}>
            <ListItemHeader index={i} label="Q&A" onRemove={() => removeItem('faq.items', i)} />
            <Field label="Question" value={item.q} onChange={v => setArr('faq.items', i, 'q', v)} />
            <Field label="Answer" value={item.a} onChange={v => setArr('faq.items', i, 'a', v)} rows={3} />
          </div>
        ))}
        <AddItemButton label="Add Q&A" onClick={() => addItem('faq.items', { q: '', a: '' })} />
      </div>

      {/* Footer */}
      <div className="admin-card">
        <div className="admin-card-title">🦶 Footer</div>
        <Field label="Tagline" value={content.footer?.tagline} onChange={v => set('footer.tagline', v)} />
        <Field label="Copyright text" value={content.footer?.copyright} onChange={v => set('footer.copyright', v)} />
        {content.footer?.columns?.map((col, ci) => (
          <div key={ci}>
            <ListItemHeader index={ci} label="Column" onRemove={() => removeItem('footer.columns', ci)} />
            <Field label="Column title" value={col.title} onChange={v => setArr('footer.columns', ci, 'title', v)} />
            <div style={{ marginTop: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Links</label>
              {col.links?.map((link, li) => (
                <div key={li} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="text" value={link} onChange={e => setFooterLink(ci, li, e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)' }} />
                  <button className="btn btn-ghost admin-remove-btn" onClick={() => removeFooterLink(ci, li)} title="Remove">✕</button>
                </div>
              ))}
              <AddItemButton label="Add link" onClick={() => addFooterLink(ci)} />
            </div>
          </div>
        ))}
        <AddItemButton label="Add column" onClick={() => addItem('footer.columns', { title: '', links: [] })} />
      </div>
    </>
  )
}

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const token = await apiAuth(pw)
      sessionStorage.setItem('kidi-admin-token', token)
      onLogin()
    } catch (e) {
      setError(e.message || 'Incorrect password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-logo">kidi.ai</div>
        <div className="admin-login-title">Admin Access</div>
        <div className="admin-login-sub">Enter your admin password to continue</div>
        {error && <div className="admin-login-error">{error}</div>}
        <div className="admin-field">
          <input type="password" placeholder="Password" value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            disabled={loading} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>
      </div>
    </div>
  )
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!toast) return null
  return (
    <div className={`admin-toast ${toast.type}`} onClick={onDismiss}>
      {toast.msg}
    </div>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'settings', icon: '⚙️', label: 'Global Settings' },
  { id: 'content-en', icon: '🇬🇧', label: 'Content (EN)' },
  { id: 'content-tr', icon: '🇹🇷', label: 'Content (TR)' },
]

export default function Admin() {
  const { theme, toggleTheme } = useSite()
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('kidi-admin-token'))
  const [activeSection, setActiveSection] = useState('settings')
  const [settingsData, setSettingsData] = useState(null)
  const [contentEn, setContentEn] = useState(null)
  const [contentTr, setContentTr] = useState(null)
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [snapshot, setSnapshot] = useState({ settings: null, en: null, tr: null })

  useEffect(() => {
    if (!authed) return
    const load = async () => {
      const [s, en, tr] = await Promise.all([
        fetch('/content/settings.json').then(r => r.json()),
        fetch('/content/en.json').then(r => r.json()),
        fetch('/content/tr.json').then(r => r.json()),
      ])
      setSettingsData(s)
      setContentEn(en)
      setContentTr(tr)
      setSnapshot({ settings: JSON.stringify(s), en: JSON.stringify(en), tr: JSON.stringify(tr) })
      setDirty(false)
    }
    load()
  }, [authed])

  useEffect(() => {
    if (!dirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const handleLogin = () => setAuthed(true)

  const handleLogout = () => {
    sessionStorage.removeItem('kidi-admin-token')
    setAuthed(false)
  }

  const handleSettingsChange = (v) => { setSettingsData(v); setDirty(true) }
  const handleEnChange = (v) => { setContentEn(v); setDirty(true) }
  const handleTrChange = (v) => { setContentTr(v); setDirty(true) }

  const handleSave = async () => {
    setToast({ msg: 'Saving to GitHub...', type: 'saving' })
    try {
      const tasks = []
      if (settingsData && JSON.stringify(settingsData) !== snapshot.settings) {
        tasks.push(apiSave('public/content/settings.json', settingsData, 'Admin: update settings'))
      }
      if (contentEn && JSON.stringify(contentEn) !== snapshot.en) {
        tasks.push(apiSave('public/content/en.json', contentEn, 'Admin: update EN content'))
      }
      if (contentTr && JSON.stringify(contentTr) !== snapshot.tr) {
        tasks.push(apiSave('public/content/tr.json', contentTr, 'Admin: update TR content'))
      }

      if (tasks.length === 0) {
        setToast({ msg: 'No changes to save', type: '' })
        return
      }

      await Promise.all(tasks)
      setSnapshot({
        settings: JSON.stringify(settingsData),
        en: JSON.stringify(contentEn),
        tr: JSON.stringify(contentTr),
      })
      setDirty(false)
      setToast({ msg: '✓ Saved! Deployment triggered — live in ~60s', type: 'success' })
    } catch (e) {
      if (e.message?.includes('Unauthorized')) {
        setToast({ msg: '✗ Session expired. Please sign in again.', type: 'error' })
        handleLogout()
        return
      }
      setToast({ msg: `✗ ${e.message}`, type: 'error' })
    }
  }

  if (!authed) return <AdminLogin onLogin={handleLogin} />

  const currentData = activeSection === 'settings' ? settingsData
    : activeSection === 'content-en' ? contentEn : contentTr
  const isReady = !!currentData

  return (
    <div className="admin-page">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="admin-topbar">
        <button className="admin-mobile-menu-btn" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          ☰
        </button>
        <span className="admin-topbar-logo">kidi.ai admin</span>
        <a href="/" target="_blank" className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}>
          ↗ View site
        </a>
        <button className="nav-icon-btn" onClick={toggleTheme}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        <button className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: 13 }}
          onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {mobileNavOpen && (
        <div className="admin-mobile-nav">
          {NAV_SECTIONS.map(s => (
            <button key={s.id} className={`admin-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => { setActiveSection(s.id); setMobileNavOpen(false) }}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="admin-body">
        <aside className="admin-sidebar">
          {NAV_SECTIONS.map(s => (
            <button key={s.id} className={`admin-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16 }}>
            <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Deploy</div>
            <div style={{ padding: '8px 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 600 }}>
              Changes save to GitHub → auto-deploy on DigitalOcean / Netlify / Vercel.
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="admin-content">
            <div className="admin-section-title">
              {NAV_SECTIONS.find(s => s.id === activeSection)?.icon}{' '}
              {NAV_SECTIONS.find(s => s.id === activeSection)?.label}
            </div>
            <div className="admin-section-desc">
              {activeSection === 'settings' && 'Manage your logo, favicon, brand colors, section ordering and contact info.'}
              {activeSection === 'content-en' && 'Edit all English text — hero, features, pricing, FAQ, footer and more.'}
              {activeSection === 'content-tr' && 'Edit all Turkish text — hero, features, pricing, FAQ, footer and more.'}
            </div>

            {!isReady && (
              <div style={{ textAlign: 'center', padding: 48, opacity: 0.5 }}>Loading content...</div>
            )}

            {isReady && activeSection === 'settings' && (
              <SettingsEditor settings={settingsData} onChange={handleSettingsChange} />
            )}
            {isReady && activeSection === 'content-en' && (
              <ContentEditor content={contentEn} onChange={handleEnChange} />
            )}
            {isReady && activeSection === 'content-tr' && (
              <ContentEditor content={contentTr} onChange={handleTrChange} />
            )}
          </div>

          <div className="admin-save-bar">
            <div className={`admin-save-status ${dirty ? 'dirty' : ''}`}>
              {dirty ? '● Unsaved changes' : ''}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={!isReady}
                style={{ opacity: isReady ? 1 : 0.5 }}>
                💾 Save & Deploy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
