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

function handleUnauthorized() {
  sessionStorage.removeItem('kidi-admin-token')
  window.location.reload()
}

async function apiSave(filePath, content) {
  const res = await fetch('/api/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ filePath, content }),
  })
  if (res.status === 401) return handleUnauthorized()
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
  const [uploading, setUploading] = useState(false)
  const handleFile = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
      if (res.status === 401) return handleUnauthorized()
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onChange(data.url)
    } catch (err) {
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
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
            disabled={uploading}
            onClick={() => ref.current.click()}>
            {uploading ? 'Uploading...' : 'Upload image'}
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
  { id: 'parentApp', visible: true },
  { id: 'howItWorks', visible: true },
  { id: 'pricing', visible: true },
  { id: 'testimonials', visible: true },
  { id: 'faq', visible: true },
]

const SECTION_LABELS = {
  hero: 'Hero',
  features: 'Features',
  parentApp: 'Parent App',
  howItWorks: 'How It Works',
  pricing: 'Pricing',
  testimonials: 'Testimonials',
  faq: 'FAQ',
}

function SectionOrderEditor({ sections, onChange }) {
  const saved = sections?.length ? sections : DEFAULT_SECTIONS
  const savedIds = new Set(saved.map(s => s.id))
  const missing = DEFAULT_SECTIONS.filter(s => !savedIds.has(s.id))
  const items = missing.length ? [...saved, ...missing] : saved

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
      <div className="admin-card">
        <div className="admin-card-title">🌐 SEO / Site Settings</div>
        <Field label="Site URL (canonical)" value={settings.seo?.siteUrl}
          onChange={v => set('seo.siteUrl', v)} />
        <ImageField label="Default OG image (shared on social media, 1200×630 recommended)"
          value={settings.seo?.ogImage}
          onChange={v => set('seo.ogImage', v)} previewSize={120} />
        <Field label="Twitter handle (e.g. @kidiai)" value={settings.seo?.twitterHandle}
          onChange={v => set('seo.twitterHandle', v)} />
        <Field label="Robots directive" value={settings.seo?.robots}
          onChange={v => set('seo.robots', v)} />
        <Field label="Google Site Verification code" value={settings.seo?.googleSiteVerification}
          onChange={v => set('seo.googleSiteVerification', v)} />
        <Field label="Default language (e.g. en)" value={settings.seo?.lang}
          onChange={v => set('seo.lang', v)} />
      </div>

      <SectionOrderEditor
        sections={settings.sections}
        onChange={v => set('sections', v)}
      />

      <div className="admin-card">
        <div className="admin-card-title">🖼️ Hero Image</div>
        <ImageField label="Hero image (device mockup, child with tablet, etc.)"
          value={settings.heroImage?.url}
          onChange={v => set('heroImage.url', v)} previewSize={200} />
        <Field label="Alt text (accessibility)" value={settings.heroImage?.alt}
          onChange={v => set('heroImage.alt', v)} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🖼️ Features Gallery</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          First image shows as the large main image. Others appear as thumbnails on the right. Click a thumbnail to swap it into the main view.
        </p>
        {(settings.featuresImages || []).map((img, i) => (
          <div key={i} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 10, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Image {i + 1}{i === 0 ? ' (main)' : ''}</span>
              <button className="btn btn-ghost admin-remove-btn" onClick={() => {
                const next = structuredClone(settings)
                next.featuresImages.splice(i, 1)
                onChange(next)
              }} title="Remove">✕</button>
            </div>
            <ImageField label="Image" value={img.url}
              onChange={v => {
                const next = structuredClone(settings)
                next.featuresImages[i].url = v
                onChange(next)
              }} previewSize={120} />
            <Field label="Alt text" value={img.alt}
              onChange={v => {
                const next = structuredClone(settings)
                next.featuresImages[i].alt = v
                onChange(next)
              }} />
          </div>
        ))}
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => {
          const next = structuredClone(settings)
          if (!next.featuresImages) next.featuresImages = []
          next.featuresImages.push({ url: '', alt: '' })
          onChange(next)
        }}>+ Add image</button>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Logo</div>
        <Field label="Logo text (shown when no image)" value={settings.logo?.text}
          onChange={v => set('logo.text', v)} />
        <div className="admin-field-row">
          <Field label="Logo width (px)" value={settings.logo?.width}
            onChange={v => set('logo.width', parseInt(v) || 0)} type="number" />
          <Field label="Logo height (px)" value={settings.logo?.height}
            onChange={v => set('logo.height', parseInt(v) || 0)} type="number" />
        </div>
        <ImageField label="Logo image (optional — replaces text)" value={settings.logo?.imageUrl}
          onChange={v => set('logo.imageUrl', v)} previewSize={120} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">🎨 Footer Logo</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Separate logo for the footer. If left empty, the main logo above is used.
        </p>
        <Field label="Footer logo text (shown when no image)" value={settings.footerLogo?.text}
          onChange={v => set('footerLogo.text', v)} />
        <div className="admin-field-row">
          <Field label="Width (px)" value={settings.footerLogo?.width}
            onChange={v => set('footerLogo.width', parseInt(v) || 0)} type="number" />
          <Field label="Height (px)" value={settings.footerLogo?.height}
            onChange={v => set('footerLogo.height', parseInt(v) || 0)} type="number" />
        </div>
        <ImageField label="Footer logo image (optional — replaces text)" value={settings.footerLogo?.imageUrl}
          onChange={v => set('footerLogo.imageUrl', v)} previewSize={120} />
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
        <Field label="TikTok" value={settings.social?.tiktok}
          onChange={v => set('social.tiktok', v)} />
        <Field label="YouTube" value={settings.social?.youtube}
          onChange={v => set('social.youtube', v)} />
        <Field label="LinkedIn" value={settings.social?.linkedin}
          onChange={v => set('social.linkedin', v)} />
      </div>
    </>
  )
}

// ─── Content helpers (shared by all section editors) ─────────────────────────
function useContentHelpers(content, onChange) {
  const set = (path, val) => {
    const parts = path.split('.')
    const next = structuredClone(content)
    let obj = next
    parts.slice(0, -1).forEach(k => {
      if (!obj[k]) obj[k] = {}
      obj = obj[k]
    })
    obj[parts[parts.length - 1]] = val
    onChange(next)
  }

  const setArr = (path, idx, key, val) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.forEach(k => {
      if (!obj[k]) obj[k] = []
      obj = obj[k]
    })
    if (!obj[idx]) obj[idx] = {}
    obj[idx][key] = val
    onChange(next)
  }

  const addItem = (path, template) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.slice(0, -1).forEach(k => {
      if (!obj[k]) obj[k] = {}
      obj = obj[k]
    })
    const lastKey = parts[parts.length - 1]
    if (!obj[lastKey]) obj[lastKey] = []
    obj[lastKey].push(template)
    onChange(next)
  }

  const removeItem = (path, idx) => {
    const next = structuredClone(content)
    const parts = path.split('.')
    let obj = next
    parts.slice(0, -1).forEach(k => {
      if (!obj[k]) obj[k] = {}
      obj = obj[k]
    })
    if (obj[parts[parts.length - 1]]) {
      obj[parts[parts.length - 1]].splice(idx, 1)
    }
    onChange(next)
  }

  return { set, setArr, addItem, removeItem }
}

// ─── Language Toggle ─────────────────────────────────────────────────────────
function LangTabs({ lang, onLangChange }) {
  return (
    <div className="admin-lang-tabs">
      <button className={`admin-lang-tab ${lang === 'en' ? 'active' : ''}`} onClick={() => onLangChange('en')}>EN</button>
      <button className={`admin-lang-tab ${lang === 'tr' ? 'active' : ''}`} onClick={() => onLangChange('tr')}>TR</button>
    </div>
  )
}

// ─── Individual Section Editors ──────────────────────────────────────────────
function SeoEditor({ content, onChange }) {
  const { set } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
      <Field label="Page title" value={content.meta?.title} onChange={v => set('meta.title', v)} />
      <Field label="Meta description" value={content.meta?.description}
        onChange={v => set('meta.description', v)} rows={2} />
      <Field label="Keywords (comma-separated)" value={content.meta?.keywords}
        onChange={v => set('meta.keywords', v)} />
      <Field label="OG title (leave empty to use page title)" value={content.meta?.ogTitle}
        onChange={v => set('meta.ogTitle', v)} />
      <Field label="OG description (leave empty to use meta description)" value={content.meta?.ogDescription}
        onChange={v => set('meta.ogDescription', v)} rows={2} />
    </div>
  )
}

function NavEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
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
  )
}

function HeroEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  const cards = content.hero?.floaterCards || []
  return (
    <div className="admin-card">
      <Field label="Badge text" value={content.hero?.badge} onChange={v => set('hero.badge', v)} />
      <div className="admin-field-row">
        <Field label="Title (first line)" value={content.hero?.title} onChange={v => set('hero.title', v)} />
        <Field label="Title accent word" value={content.hero?.titleAccent} onChange={v => set('hero.titleAccent', v)} />
      </div>
      <Field label="Subtitle" value={content.hero?.subtitle} onChange={v => set('hero.subtitle', v)} rows={2} />
      <div className="admin-field-row">
        <Field label="Primary CTA text" value={content.hero?.cta} onChange={v => set('hero.cta', v)} />
        <Field label="Primary CTA link" value={content.hero?.ctaLink} onChange={v => set('hero.ctaLink', v)} placeholder="#pricing" />
      </div>
      <div className="admin-field-row">
        <Field label="Secondary CTA text" value={content.hero?.ctaSecondary} onChange={v => set('hero.ctaSecondary', v)} />
        <Field label="Secondary CTA link" value={content.hero?.ctaSecondaryLink} onChange={v => set('hero.ctaSecondaryLink', v)} placeholder="#features" />
      </div>
      <Field label="Trust line (below buttons)" value={content.hero?.trustLine} onChange={v => set('hero.trustLine', v)} />

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '2px solid var(--border)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Floating Stat Cards</div>
        {cards.map((card, i) => (
          <div key={i}>
            <div style={{ padding: '12px 0 8px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)' }}>Card {i + 1}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: card.visible !== false ? 'var(--primary)' : 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={card.visible !== false}
                    onChange={e => setArr('hero.floaterCards', i, 'visible', e.target.checked)}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  {card.visible !== false ? 'Visible' : 'Hidden'}
                </label>
              </div>
              <button className="btn btn-ghost admin-remove-btn" onClick={() => removeItem('hero.floaterCards', i)} title="Remove">✕</button>
            </div>
            <div className="admin-field-row">
              <Field label="Emoji" value={card.emoji} onChange={v => setArr('hero.floaterCards', i, 'emoji', v)} />
              <Field label="Value" value={card.value} onChange={v => setArr('hero.floaterCards', i, 'value', v)} />
              <Field label="Label" value={card.label} onChange={v => setArr('hero.floaterCards', i, 'label', v)} />
            </div>
          </div>
        ))}
        <AddItemButton label="Add card" onClick={() => addItem('hero.floaterCards', { emoji: '✨', value: '', label: '', visible: true })} />
      </div>
    </div>
  )
}

function FeaturesEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
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
  )
}

function HowItWorksEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
      <Field label="Section title" value={content.howItWorks?.title} onChange={v => set('howItWorks.title', v)} />
      <Field label="Section subtitle" value={content.howItWorks?.subtitle} onChange={v => set('howItWorks.subtitle', v)} rows={2} />
      {content.howItWorks?.steps?.map((step, i) => (
        <div key={i}>
          <ListItemHeader index={i} label="Step" onRemove={() => removeItem('howItWorks.steps', i)} />
          <Field label="Title" value={step.title} onChange={v => setArr('howItWorks.steps', i, 'title', v)} />
          <Field label="Description" value={step.desc} onChange={v => setArr('howItWorks.steps', i, 'desc', v)} rows={2} />
          <ImageField label="Step image (optional, replaces number)" value={step.image}
            onChange={v => setArr('howItWorks.steps', i, 'image', v)} previewSize={80} />
        </div>
      ))}
      <AddItemButton label="Add step" onClick={() => addItem('howItWorks.steps', { number: String(content.howItWorks.steps.length + 1).padStart(2, '0'), title: '', desc: '', image: '' })} />
    </div>
  )
}

function PricingEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)

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

  return (
    <div className="admin-card">
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
  )
}

function TestimonialsEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
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
  )
}

function FaqEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
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
  )
}

function ParentAppEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)
  return (
    <div className="admin-card">
      <Field label="Section title" value={content.parentApp?.title} onChange={v => set('parentApp.title', v)} />
      <Field label="Subtitle" value={content.parentApp?.subtitle}
        onChange={v => set('parentApp.subtitle', v)} rows={2} />
      {content.parentApp?.features?.map((f, i) => (
        <div key={i}>
          <ListItemHeader index={i} label="Feature" onRemove={() => removeItem('parentApp.features', i)} />
          <div className="admin-field-row">
            <Field label="Icon (emoji)" value={f.icon} onChange={v => setArr('parentApp.features', i, 'icon', v)} />
            <Field label="Text" value={f.text} onChange={v => setArr('parentApp.features', i, 'text', v)} />
          </div>
        </div>
      ))}
      <AddItemButton label="Add feature" onClick={() => addItem('parentApp.features', { icon: '✨', text: '' })} />
    </div>
  )
}

function ParentAppSettingsCard({ settings, onChange }) {
  const pa = settings.parentApp || {}

  const set = (key, val) => {
    const next = structuredClone(settings)
    if (!next.parentApp) next.parentApp = {}
    next.parentApp[key] = val
    onChange(next)
  }

  const setScreenshot = (idx, field, val) => {
    const next = structuredClone(settings)
    if (!next.parentApp) next.parentApp = {}
    if (!next.parentApp.screenshots) next.parentApp.screenshots = []
    next.parentApp.screenshots[idx][field] = val
    onChange(next)
  }

  const addScreenshot = () => {
    const next = structuredClone(settings)
    if (!next.parentApp) next.parentApp = {}
    if (!next.parentApp.screenshots) next.parentApp.screenshots = []
    next.parentApp.screenshots.push({ url: '', alt: '' })
    onChange(next)
  }

  const removeScreenshot = (idx) => {
    const next = structuredClone(settings)
    next.parentApp.screenshots.splice(idx, 1)
    onChange(next)
  }

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-title">Phone Screenshots</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Screenshots shown inside the phone mockup. First image is active by default; visitors click thumbnails to switch.
        </p>
        {(pa.screenshots || []).map((s, i) => (
          <div key={i} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 10, background: 'var(--bg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Screenshot {i + 1}</span>
              <button className="btn btn-ghost admin-remove-btn" onClick={() => removeScreenshot(i)} title="Remove">✕</button>
            </div>
            <ImageField label="Image" value={s.url} onChange={v => setScreenshot(i, 'url', v)} previewSize={80} />
            <Field label="Alt text" value={s.alt} onChange={v => setScreenshot(i, 'alt', v)} />
          </div>
        ))}
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={addScreenshot}>+ Add screenshot</button>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">App Store Links</div>
        <Field label="App Store URL" value={pa.appStoreUrl || ''} onChange={v => set('appStoreUrl', v)}
          placeholder="https://apps.apple.com/..." />
        <ImageField label="App Store badge image" value={pa.appStoreBadge || ''}
          onChange={v => set('appStoreBadge', v)} previewSize={60} />
        <Field label="Google Play URL" value={pa.playStoreUrl || ''} onChange={v => set('playStoreUrl', v)}
          placeholder="https://play.google.com/store/apps/..." />
        <ImageField label="Google Play badge image" value={pa.playStoreBadge || ''}
          onChange={v => set('playStoreBadge', v)} previewSize={60} />
      </div>
    </>
  )
}

function FooterEditor({ content, onChange }) {
  const { set, setArr, addItem, removeItem } = useContentHelpers(content, onChange)

  const setFooterLinkField = (colIdx, linkIdx, field, val) => {
    const next = structuredClone(content)
    const link = next.footer.columns[colIdx].links[linkIdx]
    if (typeof link === 'string') {
      next.footer.columns[colIdx].links[linkIdx] = { label: link, href: '#', [field]: val }
    } else {
      next.footer.columns[colIdx].links[linkIdx] = { ...link, [field]: val }
    }
    onChange(next)
  }
  const addFooterLink = (colIdx) => {
    const next = structuredClone(content)
    next.footer.columns[colIdx].links.push({ label: '', href: '#' })
    onChange(next)
  }
  const removeFooterLink = (colIdx, linkIdx) => {
    const next = structuredClone(content)
    next.footer.columns[colIdx].links.splice(linkIdx, 1)
    onChange(next)
  }

  const inputStyle = { flex: 1, padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)' }

  return (
    <div className="admin-card">
      <Field label="Tagline" value={content.footer?.tagline} onChange={v => set('footer.tagline', v)} />
      <Field label="Copyright text" value={content.footer?.copyright} onChange={v => set('footer.copyright', v)} />
      {content.footer?.columns?.map((col, ci) => (
        <div key={ci}>
          <ListItemHeader index={ci} label="Column" onRemove={() => removeItem('footer.columns', ci)} />
          <Field label="Column title" value={col.title} onChange={v => setArr('footer.columns', ci, 'title', v)} />
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>Links</label>
            {col.links?.map((link, li) => {
              const label = typeof link === 'string' ? link : (link.label || '')
              const href = typeof link === 'string' ? '#' : (link.href || '#')
              return (
                <div key={li} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="text" value={label} placeholder="Label"
                    onChange={e => setFooterLinkField(ci, li, 'label', e.target.value)}
                    style={inputStyle} />
                  <input type="text" value={href} placeholder="URL (e.g. /about or https://...)"
                    onChange={e => setFooterLinkField(ci, li, 'href', e.target.value)}
                    style={inputStyle} />
                  <button className="btn btn-ghost admin-remove-btn" onClick={() => removeFooterLink(ci, li)} title="Remove">✕</button>
                </div>
              )
            })}
            <AddItemButton label="Add link" onClick={() => addFooterLink(ci)} />
          </div>
        </div>
      ))}
      <AddItemButton label="Add column" onClick={() => addItem('footer.columns', { title: '', links: [] })} />

      <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>Social Media Links</label>
        {(content.footer?.social || []).map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <select value={s.platform || ''} onChange={e => {
              const next = structuredClone(content)
              next.footer.social[i].platform = e.target.value
              onChange(next)
            }} style={{ padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)', minWidth: 120 }}>
              <option value="">Platform</option>
              <option value="instagram">Instagram</option>
              <option value="twitter">X (Twitter)</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
            <input type="text" value={s.label || ''} placeholder="Label"
              onChange={e => {
                const next = structuredClone(content)
                next.footer.social[i].label = e.target.value
                onChange(next)
              }}
              style={inputStyle} />
            <input type="text" value={s.url || ''} placeholder="https://..."
              onChange={e => {
                const next = structuredClone(content)
                next.footer.social[i].url = e.target.value
                onChange(next)
              }}
              style={inputStyle} />
            <button className="btn btn-ghost admin-remove-btn" onClick={() => {
              const next = structuredClone(content)
              next.footer.social.splice(i, 1)
              onChange(next)
            }} title="Remove">✕</button>
          </div>
        ))}
        <AddItemButton label="Add social link" onClick={() => {
          const next = structuredClone(content)
          if (!next.footer.social) next.footer = { ...next.footer, social: [] }
          next.footer.social.push({ platform: '', url: '', label: '' })
          onChange(next)
        }} />
      </div>
    </div>
  )
}

// ─── About Page Editor ────────────────────────────────────────────────────────
function AboutEditor({ content, onChange }) {
  const { set } = useContentHelpers(content, onChange)
  const [preview, setPreview] = useState(false)
  const about = content?.about || {}
  return (
    <div className="admin-card">
      <Field label="Title" value={about.title || ''} onChange={v => set('about.title', v)} />
      <Field label="Subtitle" value={about.subtitle || ''} onChange={v => set('about.subtitle', v)} rows={2} />
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>HTML Body</label>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => setPreview(!preview)}>
            {preview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
        {preview ? (
          <div className="legal-content" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24, maxHeight: 500, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: about.body || '' }} />
        ) : (
          <textarea value={about.body || ''} onChange={e => set('about.body', e.target.value)} rows={18} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, resize: 'vertical' }} />
        )}
      </div>
    </div>
  )
}

// ─── Contact Page Editor ──────────────────────────────────────────────────────
function ContactEditor({ content, onChange }) {
  const { set } = useContentHelpers(content, onChange)
  const [preview, setPreview] = useState(false)
  const contact = content?.contact || {}
  return (
    <div className="admin-card">
      <Field label="Title" value={contact.title || ''} onChange={v => set('contact.title', v)} />
      <Field label="Subtitle" value={contact.subtitle || ''} onChange={v => set('contact.subtitle', v)} rows={2} />
      <div className="admin-field-row">
        <Field label="Email" value={contact.email || ''} onChange={v => set('contact.email', v)} />
        <Field label="Phone" value={contact.phone || ''} onChange={v => set('contact.phone', v)} />
      </div>
      <Field label="Address" value={contact.address || ''} onChange={v => set('contact.address', v)} rows={2} />
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>HTML Body</label>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => setPreview(!preview)}>
            {preview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
        {preview ? (
          <div className="legal-content" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 24, maxHeight: 500, overflow: 'auto' }} dangerouslySetInnerHTML={{ __html: contact.body || '' }} />
        ) : (
          <textarea value={contact.body || ''} onChange={e => set('contact.body', e.target.value)} rows={18} style={{ width: '100%', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.5, background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, resize: 'vertical' }} />
        )}
      </div>
    </div>
  )
}

// ─── Legal Page Editor ────────────────────────────────────────────────────────
function LegalEditor({ contentKey }) {
  return function LegalEditorInner({ content, onChange }) {
    const { set } = useContentHelpers(content, onChange)
    const [preview, setPreview] = useState(false)
    const page = content?.[contentKey] || {}
    const prefix = contentKey

    return (
      <div className="admin-card">
        <div className="admin-field-row">
          <Field label="Page title" value={page.title || ''} onChange={v => set(`${prefix}.title`, v)} />
          <Field label="Badge text" value={page.badge || ''} onChange={v => set(`${prefix}.badge`, v)} />
        </div>
        <div className="admin-field-row">
          <Field label="Effective date" value={page.effectiveDate || ''} onChange={v => set(`${prefix}.effectiveDate`, v)} />
          <Field label="Last updated" value={page.lastUpdated || ''} onChange={v => set(`${prefix}.lastUpdated`, v)} />
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>HTML Body</label>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={() => setPreview(!preview)}
            >
              {preview ? '✏️ Edit' : '👁️ Preview'}
            </button>
          </div>
          {preview ? (
            <div
              className="legal-content"
              style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px',
                maxHeight: 600,
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: page.body || '' }}
            />
          ) : (
            <textarea
              value={page.body || ''}
              onChange={e => set(`${prefix}.body`, e.target.value)}
              rows={24}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.5,
                background: 'var(--bg)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: 16,
                resize: 'vertical',
              }}
            />
          )}
        </div>
      </div>
    )
  }
}

const LegalTermsEditor = LegalEditor({ contentKey: 'terms' })
const LegalPrivacyEditor = LegalEditor({ contentKey: 'privacy' })
const LegalKvkkEditor = LegalEditor({ contentKey: 'kvkk' })

// ─── Admin Login ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const { settings } = useSite()
  const logo = settings?.logo
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
        <div className="admin-login-logo">
          {logo?.imageUrl
            ? <img src={logo.imageUrl} alt={logo.text || 'kidi.ai'} style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            : (logo?.text || 'kidi.ai')
          }
        </div>
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

// ─── Import / Export ─────────────────────────────────────────────────────────
function ExportImportBar({ data, lang, onImport }) {
  const fileRef = useRef()

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lang}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        onImport(parsed)
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="admin-card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="admin-card-title" style={{ marginBottom: 4 }}>📦 Bulk Edit</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Export as JSON, edit externally, then import back.
        </div>
      </div>
      <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleExport}>
        ⬇ Export JSON
      </button>
      <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => fileRef.current.click()}>
        ⬆ Import JSON
      </button>
      <input ref={fileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  )
}

// ─── WhatsApp Settings Editor ────────────────────────────────────────────────
function WhatsAppEditor({ settings, onChange }) {
  const set = (path, val) => {
    const next = structuredClone(settings)
    const parts = path.split('.')
    let obj = next
    parts.slice(0, -1).forEach(k => {
      if (!obj[k]) obj[k] = {}
      obj = obj[k]
    })
    obj[parts[parts.length - 1]] = val
    onChange(next)
  }

  const wa = settings.whatsapp || {}

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-title">Toggle</div>
        <div className="admin-field">
          <label>Enable WhatsApp button</label>
          <label className="admin-toggle" style={{ marginTop: 4 }}>
            <input type="checkbox" checked={!!wa.enabled} onChange={e => set('whatsapp.enabled', e.target.checked)} />
            <span className="admin-toggle-slider" />
          </label>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-title">Phone & Messages</div>
        <Field label="Phone number (with country code, e.g. 905551234567)" value={wa.phoneNumber}
          onChange={v => set('whatsapp.phoneNumber', v)} />
        <Field label="Welcome message (shown in popup bubble)" value={wa.welcomeMessage}
          onChange={v => set('whatsapp.welcomeMessage', v)} rows={3} />
        <Field label="Pre-fill message (auto-filled in WhatsApp chat input)" value={wa.prefillMessage}
          onChange={v => set('whatsapp.prefillMessage', v)} rows={2} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">Agent Info</div>
        <Field label="Agent name" value={wa.agentName}
          onChange={v => set('whatsapp.agentName', v)} />
        <ImageField label="Agent photo" value={wa.agentPhoto}
          onChange={v => set('whatsapp.agentPhoto', v)} previewSize={64} />
      </div>

      <div className="admin-card">
        <div className="admin-card-title">Appearance</div>
        <div className="admin-field">
          <label>Button icon</label>
          <select
            value={wa.icon || 'message'}
            onChange={e => set('whatsapp.icon', e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14,
              color: 'var(--text)', width: '100%'
            }}
          >
            <option value="message">Chat / Message</option>
            <option value="phone">Phone</option>
          </select>
        </div>
        <div className="admin-field">
          <label>Button position</label>
          <select
            value={wa.position || 'right'}
            onChange={e => set('whatsapp.position', e.target.value)}
            style={{
              padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font)', fontSize: 14,
              color: 'var(--text)', width: '100%'
            }}
          >
            <option value="right">Bottom Right</option>
            <option value="left">Bottom Left</option>
          </select>
        </div>
      </div>
    </>
  )
}

// ─── Section wrapper with language toggle ────────────────────────────────────
function SectionWithLang({ contentEn, contentTr, onEnChange, onTrChange, editor }) {
  const [lang, setLang] = useState('en')
  const content = lang === 'en' ? contentEn : contentTr
  const onChange = lang === 'en' ? onEnChange : onTrChange
  const Editor = editor
  if (!content) return null
  return (
    <>
      <LangTabs lang={lang} onLangChange={setLang} />
      <Editor content={content} onChange={onChange} />
    </>
  )
}

// ─── Backup / Restore Editor ─────────────────────────────────────────────────
function BackupRestoreEditor() {
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const restoreFileRef = useRef()

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/backups', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (res.status === 401) return handleUnauthorized()
      const data = await res.json()
      if (res.ok) setBackups(data.backups || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { loadBackups() }, [])

  const handleDownload = async () => {
    setLoading(true)
    setStatus('Preparing backup...')
    try {
      const res = await fetch('/api/backup', {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        let msg = `Server returned ${res.status}`
        try { msg = JSON.parse(body).error || msg } catch { /* not json */ }
        throw new Error(msg)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      a.download = match ? match[1] : 'kidi-backup.zip'
      a.click()
      URL.revokeObjectURL(url)
      setStatus('Backup downloaded')
    } catch (e) {
      setStatus('Download failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    if (!confirm('This will replace all current content and images with the backup. A snapshot of the current state will be saved first. Continue?')) return
    setLoading(true)
    setStatus('Restoring from backup...')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Restore failed')
      setStatus(`Restored ${data.restored.content.length} content files, ${data.restored.uploads.length} uploads. Reload the page to see changes.`)
      loadBackups()
    } catch (e) {
      setStatus('Restore failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreSnapshot = async (timestamp) => {
    if (!confirm('Restore this auto-backup? Current content will be backed up first.')) return
    setLoading(true)
    setStatus('Restoring snapshot...')
    try {
      const res = await fetch('/api/restore-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ timestamp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Restore failed')
      setStatus(`Restored ${data.restored.length} files. Reload the page to see changes.`)
      loadBackups()
    } catch (e) {
      setStatus('Restore failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (ts) => {
    try {
      const iso = ts.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2}).*/, '$1-$2-$3T$4:$5:$6')
      return new Date(iso).toLocaleString()
    } catch { return ts }
  }

  return (
    <>
      <div className="admin-card">
        <div className="admin-card-title">Full Backup</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          Download a .zip archive containing all content files (settings, translations) and uploaded images.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleDownload} disabled={loading}
            style={{ padding: '10px 20px', fontSize: 14 }}>
            {loading ? 'Working...' : 'Download Backup'}
          </button>
          <button className="btn btn-ghost" onClick={() => restoreFileRef.current.click()} disabled={loading}
            style={{ padding: '10px 20px', fontSize: 14 }}>
            Restore from .zip
          </button>
          <input ref={restoreFileRef} type="file" accept=".zip" style={{ display: 'none' }} onChange={handleRestoreFile} />
        </div>
        {status && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
            {status}
          </div>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-title">Auto-Backup History</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
          A snapshot is saved automatically before every content save. The last {backups.length} snapshots are kept.
        </p>
        {backups.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>No auto-backups yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {backups.map(b => (
              <div key={b.timestamp} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', fontSize: 13,
              }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{formatDate(b.timestamp)}</span>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                    ({b.files.length} files)
                  </span>
                </div>
                <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: 12 }}
                  onClick={() => handleRestoreSnapshot(b.timestamp)} disabled={loading}>
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: 'settings', icon: '⚙️', label: 'Settings', group: 'general' },
  { id: 'whatsapp', icon: '📱', label: 'WhatsApp', group: 'general' },
  { id: 'seo', icon: '🔍', label: 'SEO / Meta', group: 'content' },
  { id: 'nav', icon: '🧭', label: 'Navigation', group: 'content' },
  { id: 'hero', icon: '🦸', label: 'Hero', group: 'content' },
  { id: 'features', icon: '⭐', label: 'Features', group: 'content' },
  { id: 'parentApp', icon: '📱', label: 'Parent App', group: 'content' },
  { id: 'howItWorks', icon: '⚙️', label: 'How It Works', group: 'content' },
  { id: 'pricing', icon: '💰', label: 'Pricing', group: 'content' },
  { id: 'testimonials', icon: '💬', label: 'Testimonials', group: 'content' },
  { id: 'faq', icon: '❓', label: 'FAQ', group: 'content' },
  { id: 'footer', icon: '🦶', label: 'Footer', group: 'content' },
  { id: 'about', icon: '🏢', label: 'About', group: 'pages' },
  { id: 'contact', icon: '✉️', label: 'Contact', group: 'pages' },
  { id: 'legalTerms', icon: '📋', label: 'Terms of Service', group: 'legal' },
  { id: 'legalPrivacy', icon: '🔒', label: 'Privacy Policy', group: 'legal' },
  { id: 'legalKvkk', icon: '🛡️', label: 'KVKK Notice', group: 'legal' },
  { id: 'bulk', icon: '📦', label: 'Export / Import', group: 'tools' },
  { id: 'backup', icon: '💾', label: 'Backup / Restore', group: 'tools' },
]

const SECTION_EDITORS = {
  seo: SeoEditor,
  nav: NavEditor,
  hero: HeroEditor,
  features: FeaturesEditor,
  parentApp: ParentAppEditor,
  howItWorks: HowItWorksEditor,
  pricing: PricingEditor,
  testimonials: TestimonialsEditor,
  faq: FaqEditor,
  footer: FooterEditor,
  about: AboutEditor,
  contact: ContactEditor,
  legalTerms: LegalTermsEditor,
  legalPrivacy: LegalPrivacyEditor,
  legalKvkk: LegalKvkkEditor,
}

const SECTION_DESCRIPTIONS = {
  settings: 'Manage your logo, favicon, brand colors, section ordering and contact info.',
  whatsapp: 'Configure the floating WhatsApp chat button — agent info, messages and position.',
  seo: 'Edit page title, meta description, keywords and Open Graph tags.',
  nav: 'Configure navigation links and CTA button text.',
  hero: 'Edit the hero section — headline, subtitle, CTA buttons.',
  features: 'Manage feature cards — icons, titles, descriptions.',
  parentApp: 'Showcase the parent mobile app — screenshots, features, and app store links.',
  howItWorks: 'Edit the "How It Works" steps.',
  pricing: 'Configure pricing plans, features and badges.',
  testimonials: 'Manage customer testimonials and quotes.',
  faq: 'Edit frequently asked questions and answers.',
  footer: 'Configure footer columns, links, social media accounts and copyright text.',
  about: 'Edit the About page modal — company info, mission and values.',
  contact: 'Edit the Contact page modal — email, address, phone and additional info.',
  legalTerms: 'Edit the Terms of Service page — title, dates and HTML body.',
  legalPrivacy: 'Edit the Privacy Policy page — title, dates and HTML body.',
  legalKvkk: 'Edit the KVKK data protection notice (Turkish only).',
  bulk: 'Export all content as JSON, edit externally, then import back.',
  backup: 'Download a full backup (content + images) or restore from a previous one.',
}

export default function Admin() {
  const { theme, toggleTheme } = useSite()
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem('kidi-admin-token'))
  const [activeSection, setActiveSection] = useState('settings')
  const [settingsData, setSettingsData] = useState(null)
  const [contentEn, setContentEn] = useState(null)
  const [contentTr, setContentTr] = useState(null)
  const [legalEn, setLegalEn] = useState(null)
  const [legalTr, setLegalTr] = useState(null)
  const [toast, setToast] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const [snapshot, setSnapshot] = useState({ settings: null, en: null, tr: null, legalEn: null, legalTr: null })

  useEffect(() => {
    if (!authed) return
    const load = async () => {
      const [s, en, tr, legEn, legTr] = await Promise.all([
        fetch('/content/settings.json').then(r => r.json()),
        fetch('/content/en.json').then(r => r.json()),
        fetch('/content/tr.json').then(r => r.json()),
        fetch('/content/legal-en.json').then(r => r.json()).catch(() => ({})),
        fetch('/content/legal-tr.json').then(r => r.json()).catch(() => ({})),
      ])
      const defaultParentApp = {
        title: '', subtitle: '', features: []
      }
      if (!en.parentApp) en.parentApp = defaultParentApp
      if (!tr.parentApp) tr.parentApp = { ...defaultParentApp }
      const defaultFloaterCards = [
        { emoji: '🏆', value: '4.9 / 5', label: 'App Store', visible: true },
        { emoji: '📈', value: '+47%', label: 'avg. score boost', visible: true },
        { emoji: '⚡', value: '12k+', label: 'active learners', visible: true },
      ]
      if (!en.hero) en.hero = {}
      if (!en.hero.floaterCards) en.hero.floaterCards = defaultFloaterCards
      if (!tr.hero) tr.hero = {}
      if (!tr.hero.floaterCards) tr.hero.floaterCards = defaultFloaterCards.map(c => ({ ...c }))
      const defaultLegalPage = { title: '', badge: '', effectiveDate: '', lastUpdated: '', body: '' }
      if (!legEn.terms) legEn.terms = { ...defaultLegalPage }
      if (!legEn.privacy) legEn.privacy = { ...defaultLegalPage }
      if (!legTr.terms) legTr.terms = { ...defaultLegalPage }
      if (!legTr.privacy) legTr.privacy = { ...defaultLegalPage }
      if (!legTr.kvkk) legTr.kvkk = { ...defaultLegalPage }
      const defaultAbout = { title: '', subtitle: '', body: '' }
      const defaultContact = { title: '', subtitle: '', email: '', address: '', phone: '', body: '' }
      if (!en.about) en.about = { ...defaultAbout }
      if (!tr.about) tr.about = { ...defaultAbout }
      if (!en.contact) en.contact = { ...defaultContact }
      if (!tr.contact) tr.contact = { ...defaultContact }
      setSettingsData(s)
      setContentEn(en)
      setContentTr(tr)
      setLegalEn(legEn)
      setLegalTr(legTr)
      setSnapshot({
        settings: JSON.stringify(s),
        en: JSON.stringify(en),
        tr: JSON.stringify(tr),
        legalEn: JSON.stringify(legEn),
        legalTr: JSON.stringify(legTr),
      })
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
  const handleLegalEnChange = (v) => { setLegalEn(v); setDirty(true) }
  const handleLegalTrChange = (v) => { setLegalTr(v); setDirty(true) }

  const handleSave = async () => {
    setToast({ msg: 'Saving...', type: 'saving' })
    try {
      const tasks = []
      if (settingsData && JSON.stringify(settingsData) !== snapshot.settings) {
        tasks.push(apiSave('content/settings.json', settingsData))
      }
      if (contentEn && JSON.stringify(contentEn) !== snapshot.en) {
        tasks.push(apiSave('content/en.json', contentEn))
      }
      if (contentTr && JSON.stringify(contentTr) !== snapshot.tr) {
        tasks.push(apiSave('content/tr.json', contentTr))
      }
      if (legalEn && JSON.stringify(legalEn) !== snapshot.legalEn) {
        tasks.push(apiSave('content/legal-en.json', legalEn))
      }
      if (legalTr && JSON.stringify(legalTr) !== snapshot.legalTr) {
        tasks.push(apiSave('content/legal-tr.json', legalTr))
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
        legalEn: JSON.stringify(legalEn),
        legalTr: JSON.stringify(legalTr),
      })
      setDirty(false)
      setToast({ msg: '✓ Saved! Changes are live.', type: 'success' })
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

  const isReady = !!(settingsData && contentEn && contentTr && legalEn && legalTr)
  const currentNav = NAV_SECTIONS.find(s => s.id === activeSection)
  const EditorComp = SECTION_EDITORS[activeSection]

  const renderNavGroup = (group, title) => {
    const items = NAV_SECTIONS.filter(s => s.group === group)
    return (
      <>
        <div className="admin-nav-group-title">{title}</div>
        {items.map(s => (
          <button key={s.id} className={`admin-nav-item ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => setActiveSection(s.id)}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </>
    )
  }

  return (
    <div className="admin-page">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="admin-topbar">
        <button className="admin-mobile-menu-btn" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          ☰
        </button>
        <span className="admin-topbar-logo">
          {settingsData?.logo?.imageUrl
            ? <img src={settingsData.logo.imageUrl} alt={settingsData.logo.text || 'kidi.ai'} style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
            : (settingsData?.logo?.text || 'kidi.ai')
          }
          {' '}admin
        </span>
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
          {renderNavGroup('general', 'General')}
          {renderNavGroup('content', 'Content Sections')}
          {renderNavGroup('pages', 'Pages')}
          {renderNavGroup('legal', 'Legal Pages')}
          {renderNavGroup('tools', 'Tools')}
          <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16 }}>
            <div style={{ padding: '8px 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 600 }}>
              Changes are saved directly and go live instantly.
            </div>
          </div>
        </aside>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div className="admin-content">
            <div className="admin-section-title">
              {currentNav?.icon} {currentNav?.label}
            </div>
            <div className="admin-section-desc">
              {SECTION_DESCRIPTIONS[activeSection] || ''}
            </div>

            {!isReady && (
              <div style={{ textAlign: 'center', padding: 48, opacity: 0.5 }}>Loading content...</div>
            )}

            {isReady && activeSection === 'settings' && (
              <SettingsEditor settings={settingsData} onChange={handleSettingsChange} />
            )}

            {isReady && activeSection === 'whatsapp' && (
              <WhatsAppEditor settings={settingsData} onChange={handleSettingsChange} />
            )}

            {isReady && EditorComp && !activeSection.startsWith('legal') && (
              <SectionWithLang
                contentEn={contentEn}
                contentTr={contentTr}
                onEnChange={handleEnChange}
                onTrChange={handleTrChange}
                editor={EditorComp}
              />
            )}

            {isReady && (activeSection === 'legalTerms' || activeSection === 'legalPrivacy') && EditorComp && (
              <SectionWithLang
                contentEn={legalEn}
                contentTr={legalTr}
                onEnChange={handleLegalEnChange}
                onTrChange={handleLegalTrChange}
                editor={EditorComp}
              />
            )}

            {isReady && activeSection === 'legalKvkk' && (
              <>
                <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>
                  🇹🇷 Turkish only — KVKK is a Turkish regulation
                </div>
                <LegalKvkkEditor content={legalTr} onChange={handleLegalTrChange} />
              </>
            )}

            {isReady && activeSection === 'parentApp' && (
              <ParentAppSettingsCard settings={settingsData} onChange={handleSettingsChange} />
            )}

            {isReady && activeSection === 'bulk' && (
              <>
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>🇬🇧 English Content</div>
                <ExportImportBar data={contentEn} lang="en" onImport={handleEnChange} />
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>🇹🇷 Turkish Content</div>
                <ExportImportBar data={contentTr} lang="tr" onImport={handleTrChange} />
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>🇬🇧 Legal (English)</div>
                <ExportImportBar data={legalEn} lang="legal-en" onImport={handleLegalEnChange} />
                <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>🇹🇷 Legal (Turkish)</div>
                <ExportImportBar data={legalTr} lang="legal-tr" onImport={handleLegalTrChange} />
              </>
            )}

            {isReady && activeSection === 'backup' && (
              <BackupRestoreEditor />
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
