import express from 'express'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '50mb' }))

const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const DATA_DIR = path.join(__dirname, 'data', 'content')
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads')
const DIST_DIR = path.join(__dirname, 'dist')

const sessions = new Map()

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

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

const ALLOWED_FILES = ['settings.json', 'en.json', 'tr.json']

app.post('/api/save', requireAuth, async (req, res) => {
  const { filePath, content } = req.body

  const fileName = path.basename(filePath)
  if (!ALLOWED_FILES.includes(fileName)) {
    return res.status(400).json({ error: `Not allowed: ${fileName}` })
  }

  try {
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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
const MAX_UPLOAD = 10 * 1024 * 1024 // 10 MB per file

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
    const filePath = path.join(UPLOAD_DIR, safeName)
    await fs.writeFile(filePath, filePart.data)

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
    const data = part.subarray(headerEnd + 4, part.length - 2) // trim trailing \r\n

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

app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/content', express.static(DATA_DIR))
app.use(express.static(DIST_DIR))

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// JSON error handler -- catches body parser errors, etc.
// Express requires exactly 4 params to detect this as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, async () => {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {})
  await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {})
  console.log(`Server running on port ${PORT}`)
})
