const html = await fetch('https://kidi.ai').then(r => r.text())
const cssRe = /href="([^"]*\.css)"/g
const jsRe = /src="([^"]*\.js)"/g
const cssMatches = [...html.matchAll(cssRe)].map(m => m[1])
const jsMatches = [...html.matchAll(jsRe)].map(m => m[1])
console.log('CSS bundles:', cssMatches)
console.log('JS bundles:', jsMatches)

// Compare with local build
import { readFileSync } from 'fs'
const localHtml = readFileSync('dist/index.html', 'utf-8')
const localCss = [...localHtml.matchAll(/href="([^"]*\.css)"/g)].map(m => m[1])
const localJs = [...localHtml.matchAll(/src="([^"]*\.js)"/g)].map(m => m[1])
console.log('\nLocal CSS:', localCss)
console.log('Local JS:', localJs)
console.log('\nCSS match:', cssMatches[0] === localCss[0])
console.log('JS match:', jsMatches[0] === localJs[0])
