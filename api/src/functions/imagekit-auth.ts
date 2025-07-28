import type { APIGatewayEvent, Context } from 'aws-lambda'
import ImageKit from 'imagekit'

import { logger } from 'src/lib/logger'

export const handler = async (
  _event: APIGatewayEvent,
  _context: Context
) => {
  const imagekit = new ImageKit({
    publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY || '',
    urlEndpoint: import.meta.env.IMAGEKIT_URL_ENDPOINT || '',
  })

  try {
    const result = imagekit.getAuthenticationParameters()
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': import.meta.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify(result),
    }
  } catch (err) {
    logger.error('ImageKit auth failed', err)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': import.meta.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({ error: err.message }),
    }
  }
}
