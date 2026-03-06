import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'public', 'og-image.png')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFCF7"/>
      <stop offset="100%" stop-color="#FFF0E5"/>
    </linearGradient>
    <linearGradient id="bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="50%" stop-color="#FFD166"/>
      <stop offset="100%" stop-color="#06D6A0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect y="0" width="1200" height="8" fill="url(#bar)"/>
  <circle cx="1020" cy="150" r="120" fill="#FFD166" opacity="0.12"/>
  <circle cx="1100" cy="250" r="70" fill="#06D6A0" opacity="0.1"/>
  <circle cx="180" cy="520" r="80" fill="#9B5DE5" opacity="0.08"/>
  <circle cx="100" cy="450" r="45" fill="#FF6B35" opacity="0.06"/>
  <circle cx="950" cy="480" r="55" fill="#FF6B35" opacity="0.07"/>
  <text x="100" y="230" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="80" font-weight="900" fill="#1A1A2E" letter-spacing="-2">kidi.ai</text>
  <rect x="100" y="255" width="120" height="6" rx="3" fill="#FF6B35"/>
  <text x="100" y="330" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="38" font-weight="700" fill="#FF6B35">Learning that feels like play</text>
  <text x="100" y="400" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#666680">AI-powered personalized education for kids aged 4-12.</text>
  <text x="100" y="440" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#666680">Adaptive lessons, real progress, endless curiosity.</text>
  <rect x="100" y="500" width="180" height="50" rx="25" fill="#FF6B35"/>
  <text x="190" y="533" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#FFFFFF" text-anchor="middle">Get Started</text>
  <rect x="300" y="500" width="180" height="50" rx="25" fill="none" stroke="#06D6A0" stroke-width="3"/>
  <text x="390" y="533" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#06D6A0" text-anchor="middle">Learn More</text>
</svg>`

await sharp(Buffer.from(svg)).resize(1200, 630).png().toFile(outPath)
console.log('Generated og-image.png (1200x630)')
