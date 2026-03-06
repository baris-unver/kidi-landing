import Nav from '../components/Nav'
import Hero from '../components/Hero'
import { Features, ParentApp, HowItWorks, Pricing, Testimonials, FAQ, Footer } from '../components/Sections'
import WhatsAppButton from '../components/WhatsAppButton'
import { useSite } from '../context/SiteContext'

const SECTION_COMPONENTS = {
  hero: Hero,
  features: Features,
  parentApp: ParentApp,
  howItWorks: HowItWorks,
  pricing: Pricing,
  testimonials: Testimonials,
  faq: FAQ,
}

const DEFAULT_SECTIONS = [
  { id: 'hero', visible: true },
  { id: 'features', visible: true },
  { id: 'parentApp', visible: true },
  { id: 'howItWorks', visible: true },
  { id: 'pricing', visible: true },
  { id: 'testimonials', visible: true },
  { id: 'faq', visible: true },
]

export default function Landing() {
  const { loading, settings } = useSite()

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 32
    }}>
      🌟
    </div>
  )

  const saved = settings?.sections?.length ? settings.sections : DEFAULT_SECTIONS
  const savedIds = new Set(saved.map(s => s.id))
  const missing = DEFAULT_SECTIONS.filter(s => !savedIds.has(s.id))
  const sections = missing.length ? [...saved, ...missing] : saved

  return (
    <>
      <Nav />
      <main>
        {sections.filter(s => s.visible).map(s => {
          const Component = SECTION_COMPONENTS[s.id]
          return Component ? <Component key={s.id} /> : null
        })}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  )
}
