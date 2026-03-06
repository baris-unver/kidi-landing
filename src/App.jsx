import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SiteProvider } from './context/SiteContext'
import Landing from './pages/Landing'
import LegalPage from './pages/LegalPage'
import './styles/global.css'

const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <SiteProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/kvkk" element={<LegalPage />} />
          <Route path="/admin" element={<Suspense fallback={null}><Admin /></Suspense>} />
          <Route path="/admin/*" element={<Suspense fallback={null}><Admin /></Suspense>} />
        </Routes>
      </BrowserRouter>
    </SiteProvider>
  )
}
