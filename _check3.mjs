const en = await fetch('https://kidi.ai/content/en.json').then(r => r.json())
console.log('Full footer:', JSON.stringify(en.footer, null, 2))
