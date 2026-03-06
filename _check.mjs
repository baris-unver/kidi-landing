const html = await fetch('https://kidi.ai').then(r => r.text())
const jsMatch = html.match(/src="[^"]*index-[^"]*\.js"/g)
console.log('JS bundles:', jsMatch)

// Check the main JS bundle for our modal code
if (jsMatch && jsMatch[0]) {
  const src = jsMatch[0].match(/src="([^"]+)"/)[1]
  const jsUrl = 'https://kidi.ai' + src
  const js = await fetch(jsUrl).then(r => r.text())
  console.log('Has openModal:', js.includes('openModal'))
  console.log('Has PageModal:', js.includes('page-modal'))
  console.log('Has footer-legal-links:', js.includes('footer-legal-links'))
  console.log('Has #about:', js.includes('#about'))
  console.log('Has #contact:', js.includes('#contact'))
}
