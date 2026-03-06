import express from 'express'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import archiver from 'archiver'
import unzipper from 'unzipper'
import { Readable } from 'stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '50mb' }))

const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const DATA_DIR = path.join(__dirname, 'data', 'content')
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads')
const BACKUP_DIR = path.join(__dirname, 'data', 'backups')
const DIST_DIR = path.join(__dirname, 'dist')
const MAX_AUTO_BACKUPS = 20

const sessions = new Map()

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

// --- Base64 migration: extract data:image values to /uploads/ files ---

const BASE64_RE = /^data:image\/([\w+.-]+);base64,(.+)$/

const MIME_TO_EXT = {
  'png': '.png', 'jpeg': '.jpg', 'jpg': '.jpg', 'gif': '.gif',
  'webp': '.webp', 'svg+xml': '.svg', 'x-icon': '.ico',
  'vnd.microsoft.icon': '.ico',
}

async function extractBase64Value(value) {
  const match = value.match(BASE64_RE)
  if (!match) return value
  const [, mimeSubtype, b64data] = match
  const ext = MIME_TO_EXT[mimeSubtype] || '.bin'
  const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, safeName), Buffer.from(b64data, 'base64'))
  return `/uploads/${safeName}`
}

async function migrateBase64InObject(obj) {
  if (!obj || typeof obj !== 'object') return false
  let changed = false
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string' && BASE64_RE.test(val)) {
      obj[key] = await extractBase64Value(val)
      changed = true
    } else if (typeof val === 'object' && val !== null) {
      if (await migrateBase64InObject(val)) changed = true
    }
  }
  return changed
}

async function migrateSettingsFile() {
  const filesToCheck = ['settings.json', 'en.json', 'tr.json']
  for (const fileName of filesToCheck) {
    for (const dir of [DATA_DIR, path.join(DIST_DIR, 'content')]) {
      const filePath = path.join(dir, fileName)
      try {
        const raw = await fs.readFile(filePath, 'utf-8')
        const data = JSON.parse(raw)
        if (await migrateBase64InObject(data)) {
          const json = JSON.stringify(data, null, 2)
          await fs.writeFile(filePath, json, 'utf-8')
          console.log(`Migrated base64 images in ${filePath}`)
        }
      } catch {
        // file doesn't exist yet or isn't valid JSON -- skip
      }
    }
  }
}

// --- Auto-backup helpers ---

async function createAutoBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const snapshotDir = path.join(BACKUP_DIR, timestamp)
    await fs.mkdir(snapshotDir, { recursive: true })

    for (const fileName of ALLOWED_FILES) {
      const src = path.join(DATA_DIR, fileName)
      try {
        await fs.copyFile(src, path.join(snapshotDir, fileName))
      } catch {
        // file may not exist yet
      }
    }

    await pruneOldBackups()
    return timestamp
  } catch (e) {
    console.error('Auto-backup failed:', e.message)
    return null
  }
}

async function pruneOldBackups() {
  try {
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true })
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort()
    if (dirs.length > MAX_AUTO_BACKUPS) {
      const toDelete = dirs.slice(0, dirs.length - MAX_AUTO_BACKUPS)
      for (const dir of toDelete) {
        await fs.rm(path.join(BACKUP_DIR, dir), { recursive: true, force: true })
      }
    }
  } catch {
    // backup dir may not exist yet
  }
}

// --- Auth ---

app.post('/api/auth', (req, res) => {
  const { password } = req.body
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' })
  }
  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { created: Date.now() })
  res.json({ token })
})

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  sessions.delete(token)
  res.json({ ok: true })
})

// --- Save (with auto-backup) ---

const ALLOWED_FILES = ['settings.json', 'en.json', 'tr.json', 'legal-en.json', 'legal-tr.json']

app.post('/api/save', requireAuth, async (req, res) => {
  const { filePath, content } = req.body

  const fileName = path.basename(filePath)
  if (!ALLOWED_FILES.includes(fileName)) {
    return res.status(400).json({ error: `Not allowed: ${fileName}` })
  }

  try {
    await createAutoBackup()
    await migrateBase64InObject(content)
    await fs.mkdir(DATA_DIR, { recursive: true })

    const json = JSON.stringify(content, null, 2)
    const dataPath = path.join(DATA_DIR, fileName)
    await fs.writeFile(dataPath, json, 'utf-8')

    const distPath = path.join(DIST_DIR, 'content', fileName)
    await fs.writeFile(distPath, json, 'utf-8').catch(() => {})

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- Upload ---

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
const MAX_UPLOAD = 10 * 1024 * 1024

app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || ''

    if (!contentType.startsWith('multipart/form-data') && !contentType.startsWith('application/octet-stream')) {
      return res.status(400).json({ error: 'Expected file upload' })
    }

    const chunks = []
    let size = 0

    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        size += chunk.length
        if (size > MAX_UPLOAD * 2) {
          reject(new Error('File too large (max 10MB)'))
          return
        }
        chunks.push(chunk)
      })
      req.on('end', resolve)
      req.on('error', reject)
    })

    const raw = Buffer.concat(chunks)

    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Missing boundary in multipart data' })
    }

    const boundary = boundaryMatch[1]
    const parts = parseMultipart(raw, boundary)
    const filePart = parts.find(p => p.filename)

    if (!filePart) {
      return res.status(400).json({ error: 'No file found in upload' })
    }

    if (!ALLOWED_TYPES.includes(filePart.type)) {
      return res.status(400).json({ error: `File type not allowed: ${filePart.type}` })
    }

    if (filePart.data.length > MAX_UPLOAD) {
      return res.status(400).json({ error: 'File too large (max 10MB)' })
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const ext = path.extname(filePart.filename).toLowerCase() || '.bin'
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
    const uploadPath = path.join(UPLOAD_DIR, safeName)
    await fs.writeFile(uploadPath, filePart.data)

    res.json({ url: `/uploads/${safeName}` })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function parseMultipart(buffer, boundary) {
  const parts = []
  const sep = Buffer.from(`--${boundary}`)
  let start = buffer.indexOf(sep) + sep.length

  while (start < buffer.length) {
    const nextSep = buffer.indexOf(sep, start)
    if (nextSep === -1) break

    const part = buffer.subarray(start, nextSep)
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) { start = nextSep + sep.length; continue }

    const headerStr = part.subarray(0, headerEnd).toString()
    const data = part.subarray(headerEnd + 4, part.length - 2)

    const nameMatch = headerStr.match(/name="([^"]+)"/)
    const filenameMatch = headerStr.match(/filename="([^"]+)"/)
    const typeMatch = headerStr.match(/Content-Type:\s*(.+)/i)

    parts.push({
      name: nameMatch?.[1],
      filename: filenameMatch?.[1],
      type: typeMatch?.[1]?.trim(),
      data,
    })

    start = nextSep + sep.length
  }

  return parts
}

// --- Backup / Restore API ---

app.get('/api/backup', requireAuth, async (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 6 } })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="kidi-backup-${timestamp}.zip"`)

    archive.pipe(res)

    for (const fileName of ALLOWED_FILES) {
      const filePath = path.join(DATA_DIR, fileName)
      try {
        await fs.access(filePath)
        archive.file(filePath, { name: `content/${fileName}` })
      } catch {
        // skip missing files
      }
    }

    try {
      const uploadFiles = await fs.readdir(UPLOAD_DIR)
      for (const file of uploadFiles) {
        const filePath = path.join(UPLOAD_DIR, file)
        const stat = await fs.stat(filePath)
        if (stat.isFile()) {
          archive.file(filePath, { name: `uploads/${file}` })
        }
      }
    } catch {
      // uploads dir may not exist
    }

    await archive.finalize()
  } catch (e) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message })
    }
  }
})

app.post('/api/restore', requireAuth, async (req, res) => {
  try {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart file upload' })
    }

    const chunks = []
    let size = 0
    const MAX_RESTORE = 100 * 1024 * 1024 // 100MB max for restore zip

    await new Promise((resolve, reject) => {
      req.on('data', chunk => {
        size += chunk.length
        if (size > MAX_RESTORE) {
          reject(new Error('Backup file too large (max 100MB)'))
          return
        }
        chunks.push(chunk)
      })
      req.on('end', resolve)
      req.on('error', reject)
    })

    const raw = Buffer.concat(chunks)
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) {
      return res.status(400).json({ error: 'Missing boundary' })
    }

    const parts = parseMultipart(raw, boundaryMatch[1])
    const filePart = parts.find(p => p.filename?.endsWith('.zip'))

    if (!filePart) {
      return res.status(400).json({ error: 'No .zip file found in upload' })
    }

    await createAutoBackup()

    const restored = { content: [], uploads: [] }
    const stream = Readable.from(filePart.data)
    const directory = stream.pipe(unzipper.Parse())

    for await (const entry of directory) {
      const entryPath = entry.path
      const entryType = entry.type

      if (entryType === 'Directory') {
        entry.autodrain()
        continue
      }

      if (entryPath.startsWith('content/')) {
        const fileName = path.basename(entryPath)
        if (ALLOWED_FILES.includes(fileName)) {
          const entryData = await entry.buffer()
          JSON.parse(entryData.toString('utf-8'))
          await fs.mkdir(DATA_DIR, { recursive: true })
          await fs.writeFile(path.join(DATA_DIR, fileName), entryData)
          const distContentDir = path.join(DIST_DIR, 'content')
          await fs.writeFile(path.join(distContentDir, fileName), entryData).catch(() => {})
          restored.content.push(fileName)
        } else {
          entry.autodrain()
        }
      } else if (entryPath.startsWith('uploads/')) {
        const fileName = path.basename(entryPath)
        if (fileName && !fileName.startsWith('.')) {
          await fs.mkdir(UPLOAD_DIR, { recursive: true })
          const entryData = await entry.buffer()
          await fs.writeFile(path.join(UPLOAD_DIR, fileName), entryData)
          restored.uploads.push(fileName)
        } else {
          entry.autodrain()
        }
      } else {
        entry.autodrain()
      }
    }

    res.json({ ok: true, restored })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/backups', requireAuth, async (_req, res) => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true })
    const snapshots = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dirPath = path.join(BACKUP_DIR, entry.name)
      const files = await fs.readdir(dirPath)
      const stat = await fs.stat(dirPath)
      snapshots.push({
        timestamp: entry.name,
        date: stat.mtime.toISOString(),
        files,
      })
    }

    snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    res.json({ backups: snapshots })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/restore-snapshot', requireAuth, async (req, res) => {
  const { timestamp } = req.body
  if (!timestamp) {
    return res.status(400).json({ error: 'Missing timestamp' })
  }

  const safeName = path.basename(timestamp)
  const snapshotDir = path.join(BACKUP_DIR, safeName)

  try {
    await fs.access(snapshotDir)
  } catch {
    return res.status(404).json({ error: 'Snapshot not found' })
  }

  try {
    await createAutoBackup()

    const files = await fs.readdir(snapshotDir)
    const restored = []

    for (const file of files) {
      if (!ALLOWED_FILES.includes(file)) continue
      const data = await fs.readFile(path.join(snapshotDir, file))
      await fs.writeFile(path.join(DATA_DIR, file), data)
      const distPath = path.join(DIST_DIR, 'content', file)
      await fs.writeFile(distPath, data).catch(() => {})
      restored.push(file)
    }

    res.json({ ok: true, restored })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// --- Static files with caching ---

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }))

app.use('/content', express.static(DATA_DIR, { maxAge: '60000' }))

app.use(express.static(DIST_DIR, {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    }
  },
}))

app.get('/{*splat}', async (req, res) => {
  try {
    let html = await fs.readFile(path.join(DIST_DIR, 'index.html'), 'utf-8')

    const readJson = async (file) => {
      for (const dir of [DATA_DIR, path.join(DIST_DIR, 'content')]) {
        try { return JSON.parse(await fs.readFile(path.join(dir, file), 'utf-8')) } catch { /* try next */ }
      }
      return {}
    }
    const [settings, en] = await Promise.all([readJson('settings.json'), readJson('en.json')])
    const meta = en.meta || {}
    const seo = settings.seo || {}
    const title = meta.ogTitle || meta.title || 'kidi.ai'
    const desc = meta.ogDescription || meta.description || ''
    const siteUrl = seo.siteUrl || 'https://kidi.ai'
    let ogImage = seo.ogImage || ''
    if (ogImage && ogImage.startsWith('/')) ogImage = siteUrl.replace(/\/+$/, '') + ogImage

    const replacements = [
      [/(<meta\s+property="og:title"\s+content=")([^"]*)(")/, `$1${esc(title)}$3`],
      [/(<meta\s+property="og:description"\s+content=")([^"]*)(")/, `$1${esc(desc)}$3`],
      [/(<meta\s+property="og:url"\s+content=")([^"]*)(")/, `$1${esc(siteUrl)}$3`],
      [/(<meta\s+property="og:image"\s+content=")([^"]*)(")/, `$1${esc(ogImage)}$3`],
      [/(<meta\s+name="twitter:title"\s+content=")([^"]*)(")/, `$1${esc(title)}$3`],
      [/(<meta\s+name="twitter:description"\s+content=")([^"]*)(")/, `$1${esc(desc)}$3`],
      [/(<meta\s+name="twitter:image"\s+content=")([^"]*)(")/, `$1${esc(ogImage)}$3`],
      [/(<meta\s+name="description"\s+content=")([^"]*)(")/, `$1${esc(desc)}$3`],
      [/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`],
    ]
    for (const [re, replacement] of replacements) {
      html = html.replace(re, replacement)
    }
    if (!ogImage) {
      html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>[\r\n]*/g, '')
      html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>[\r\n]*/g, '')
      html = html.replace(/<meta\s+name="twitter:card"\s+content="[^"]*"\s*\/?>/, '<meta name="twitter:card" content="summary" />')
    }
    res.setHeader('Content-Type', 'text/html')
    res.setHeader('Cache-Control', 'no-cache')
    res.send(html)
  } catch {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  }
})

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

// Express requires exactly 4 params to detect this as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

async function mergeDefaults() {
  for (const fileName of ALLOWED_FILES) {
    const distPath = path.join(DIST_DIR, 'content', fileName)
    const dataPath = path.join(DATA_DIR, fileName)
    try {
      const distRaw = await fs.readFile(distPath, 'utf-8')
      const distData = JSON.parse(distRaw)
      let dataRaw
      try { dataRaw = await fs.readFile(dataPath, 'utf-8') } catch { continue }
      const dataData = JSON.parse(dataRaw)
      let changed = false
      for (const key of Object.keys(distData)) {
        if (!(key in dataData)) {
          dataData[key] = distData[key]
          changed = true
        }
      }
      if (changed) {
        await fs.writeFile(dataPath, JSON.stringify(dataData, null, 2), 'utf-8')
        console.log(`Merged new keys into data/${fileName}`)
      }
    } catch { /* skip */ }
  }

  // Migrate: move legal content from en.json/tr.json into separate legal files
  for (const lang of ['en', 'tr']) {
    const mainPath = path.join(DATA_DIR, `${lang}.json`)
    const legalPath = path.join(DATA_DIR, `legal-${lang}.json`)
    try {
      const mainRaw = await fs.readFile(mainPath, 'utf-8')
      const mainData = JSON.parse(mainRaw)
      if (!mainData.legal) continue
      let legalData = {}
      try { legalData = JSON.parse(await fs.readFile(legalPath, 'utf-8')) } catch { /* new file */ }
      for (const key of Object.keys(mainData.legal)) {
        if (!(key in legalData)) legalData[key] = mainData.legal[key]
      }
      await fs.writeFile(legalPath, JSON.stringify(legalData, null, 2), 'utf-8')
      delete mainData.legal
      await fs.writeFile(mainPath, JSON.stringify(mainData, null, 2), 'utf-8')
      console.log(`Migrated legal content from ${lang}.json to legal-${lang}.json`)
    } catch { /* skip */ }
  }
}

app.listen(PORT, async () => {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {})
  await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {})
  await fs.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {})
  await migrateSettingsFile()
  await mergeDefaults()
  console.log(`Server running on port ${PORT}`)
})
