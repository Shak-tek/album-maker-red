const express = require('express')
const bcrypt = require('bcrypt')
const Database = require('better-sqlite3')
const path = require('path')

const db = new Database('data.db')
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
)`)

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).send('Missing fields')
  try {
    const hashed = await bcrypt.hash(password, 10)
    db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hashed)
    res.status(200).send('ok')
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).send('User already exists')
    } else {
      console.error(err)
      res.status(500).send('Internal error')
    }
  }
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).send('Missing fields')
  const row = db.prepare('SELECT password FROM users WHERE email = ?').get(email)
  if (!row) return res.status(401).send('Invalid credentials')
  const match = await bcrypt.compare(password, row.password)
  if (match) {
    res.status(200).send('ok')
  } else {
    res.status(401).send('Invalid credentials')
  }
})

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'public') })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})
