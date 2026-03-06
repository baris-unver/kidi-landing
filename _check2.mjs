const en = await fetch('https://kidi.ai/content/en.json').then(r => r.json())
console.log('Footer columns:')
en.footer.columns.forEach((col, i) => {
  console.log(`  [${i}] ${col.title}:`)
  col.links.forEach(link => {
    console.log(`      ${link.label} -> ${link.href}`)
  })
})
console.log('\nAbout title:', en.about?.title)
console.log('Contact title:', en.contact?.title)
