import path from 'path'
import type { APIGatewayEvent, Context } from 'aws-lambda'

import { logger } from 'src/lib/logger'

let db: any
let Low: any
let JSONFile: any

async function getDb() {
  if (!db) {
    if (!Low || !JSONFile) {
      const lowdb = await import('lowdb')
      const lowdbNode = await import('lowdb/node')
      Low = (lowdb as any).Low
      JSONFile = (lowdbNode as any).JSONFile
    }
    const dbPath = process.env.NETLIFY_DB_PATH || path.join(__dirname, '../db/db.json')
    const file = path.resolve(dbPath)
    const adapter = new JSONFile(file)
    db = new Low(adapter)

    try {
      await db.read()
    } catch (e) {
      logger.warn('Failed to read DB file. Initializing default data.', e)
    }

    if (!db.data || typeof db.data !== 'object') {
      db.data = { users: [] }
      await db.write() // Ensure file is created/written
    }
  }
  return db
}

async function sendOtp(email: string, otp: string) {
  logger.info(`OTP for ${email}: ${otp}`)
}

export const handler = async (
  event: APIGatewayEvent,
  _context: Context
) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const db = await getDb()
    const users = db.data.users

    if (event.httpMethod === 'POST' && event.path.endsWith('/signup')) {
      const { name, email, phone, address, password } = body
      if (!name || !email || !phone || !address || !password) {
        return { statusCode: 400, body: 'Missing fields' }
      }
      const existing = users.find((u: any) => u.email === email)
      if (existing) {
        return { statusCode: 400, body: 'User already exists' }
      }
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      users.push({ name, email, phone, address, password, otp, verified: false })
      await db.write()
      await sendOtp(email, otp)
      return { statusCode: 200, body: JSON.stringify({ pending: true }) }
    }

    if (event.httpMethod === 'POST' && event.path.endsWith('/verify')) {
      const { email, otp } = body
      const user = users.find((u: any) => u.email === email)
      if (!user || user.otp !== otp) {
        return { statusCode: 400, body: 'Invalid OTP' }
      }
      Object.assign(user, { verified: true })
      delete user.otp
      await db.write()
      const { name, phone, address } = user
      return { statusCode: 200, body: JSON.stringify({ user: { name, email, phone, address } }) }
    }

    if (event.httpMethod === 'POST' && event.path.endsWith('/login')) {
      const { email, password } = body
      const user = users.find((u: any) => u.email === email)
      if (!user || user.password !== password || !user.verified) {
        return { statusCode: 401, body: 'Invalid credentials' }
      }
      const { name, phone, address } = user
      return { statusCode: 200, body: JSON.stringify({ user: { name, email, phone, address } }) }
    }

    return { statusCode: 400, body: 'Bad request' }
  } catch (err: any) {
    logger.error(err)
    return { statusCode: 500, body: err.message }
  }
}
