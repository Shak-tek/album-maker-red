const express = require('express')
const bcrypt = require('bcrypt')
const { Pool } = require('pg')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL ? { rejectUnauthorized: false } : undefined
})

pool.query(`CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT
)`).catch(err => console.error('DB init error:', err))

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.post('/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).send('Missing fields')
  try {
    const hashed = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hashed])
    res.status(200).send('ok')
  } catch (err) {
    if (err.code === '23505') {
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
  try {
    const result = await pool.query('SELECT password FROM users WHERE email = $1', [email])
    const row = result.rows[0]
    if (!row) return res.status(401).send('Invalid credentials')
    const match = await bcrypt.compare(password, row.password)
    if (match) {
      res.status(200).send('ok')
    } else {
      res.status(401).send('Invalid credentials')
    }
  } catch (err) {
    console.error(err)
    res.status(500).send('Internal error')
  }
})

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, 'public') })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server started on port ${port}`)
})
