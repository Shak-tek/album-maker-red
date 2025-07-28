import type { APIGatewayEvent, Context } from 'aws-lambda'

import { db } from 'src/lib/db'
import { logger } from 'src/lib/logger'

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  try {
    const body = JSON.parse(event.body || '{}')

    if (event.httpMethod === 'POST' && event.path.endsWith('/signup')) {
      const { name, email, address, postCode, city, phone, password } = body
      if (
        !name ||
        !email ||
        !address ||
        !postCode ||
        !city ||
        !phone ||
        !password
      ) {
        return { statusCode: 400, body: 'Missing fields' }
      }
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return { statusCode: 400, body: 'User already exists' }
      }
      await db.user.create({
        data: { name, email, address, postCode, city, phone, password },
      })
      return { statusCode: 200, body: JSON.stringify({ success: true }) }
    }

    if (event.httpMethod === 'POST' && event.path.endsWith('/login')) {
      const { email, password } = body
      const user = await db.user.findUnique({ where: { email } })
      if (!user || user.password !== password) {
        return { statusCode: 401, body: 'Invalid credentials' }
      }
      const { name, address, postCode, city, phone } = user
      return {
        statusCode: 200,
        body: JSON.stringify({
          user: { name, email, address, postCode, city, phone },
        }),
      }
    }

    return { statusCode: 400, body: 'Bad request' }
  } catch (err) {
    logger.error(err)
    return { statusCode: 500, body: (err as Error).message }
  }
}
