// Debug endpoint
try {
  const resp = await fetch('https://kidi.ai/api/og-debug')
  const data = await resp.json()
  console.log('Debug endpoint:', JSON.stringify(data, null, 2))
} catch (e) {
  console.log('Debug endpoint failed:', e.message)
}

// Check HTML
const htmlResp = await fetch('https://kidi.ai/')
const html = await htmlResp.text()
const ogMatch = html.match(/property="og:image"\s+content="([^"]*)"/)
console.log('HTML og:image:', ogMatch?.[1] || 'NOT FOUND')
