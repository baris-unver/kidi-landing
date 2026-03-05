import express from 'express'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json({ limit: '10mb' }))

const PORT = process.env.PORT || 3000
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin'
const DATA_DIR = path.join(__dirname, 'data', 'content')
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

app.use('/content', express.static(DATA_DIR))
app.use(express.static(DIST_DIR))

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

app.listen(PORT, async () => {
  await fs.mkdir(DATA_DIR, { recursive: true }).catch(() => {})
  console.log(`Server running on port ${PORT}`)
})
