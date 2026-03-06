// Check if the uploaded image is accessible
const imgUrl = 'https://kidi.ai/uploads/1772812511710-dc93287ca37a.png'
try {
  const resp = await fetch(imgUrl, { method: 'HEAD' })
  console.log('Upload image status:', resp.status, resp.headers.get('content-type'))
} catch (e) {
  console.log('Upload image error:', e.message)
}

// Check settings from API
const settingsResp = await fetch('https://kidi.ai/content/settings.json')
const settings = await settingsResp.json()
console.log('Settings seo.ogImage:', settings.seo?.ogImage)

// Check the HTML
const htmlResp = await fetch('https://kidi.ai/')
const html = await htmlResp.text()
const ogMatch = html.match(/property="og:image"\s+content="([^"]*)"/)
console.log('HTML og:image:', ogMatch?.[1] || 'NOT FOUND')
