import type { APIGatewayEvent, Context } from 'aws-lambda'
import ImageKit from 'imagekit'

import { logger } from 'src/lib/logger'

export const handler = async (
  _event: APIGatewayEvent,
  _context: Context
) => {
  const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || '',
  })

  try {
    const result = imagekit.getAuthenticationParameters()
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify(result),
    }
  } catch (err) {
    logger.error('ImageKit auth failed', err)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
