import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { APIGatewayEvent, Context } from 'aws-lambda'

import { logger } from 'src/lib/logger'

const REGION = process.env.AWS_REGION || 'us-east-1'
const BUCKET = process.env.S3_BUCKET || ''

const client = new S3Client({ region: REGION })

export const handler = async (event: APIGatewayEvent, _context: Context) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' }
    }

    switch (body.action) {
      case 'presignUpload': {
        const { key, contentType } = body
        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          ContentType: contentType,
        })
        const url = await getSignedUrl(client, command, { expiresIn: 3600 })
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
          },
          body: JSON.stringify({ url }),
        }
      }
      case 'list': {
        const { prefix } = body
        const data = await client.send(
          new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix })
        )
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
          },
          body: JSON.stringify({ contents: data.Contents || [] }),
        }
      }
      case 'delete': {
        const { keys } = body
        await client.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: { Objects: keys.map((k: string) => ({ Key: k })) },
          })
        )
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
          },
          body: JSON.stringify({ success: true }),
        }
      }
      default:
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
          },
          body: 'Unknown action',
        }
    }
  } catch (err) {
    logger.error('s3 function error', err)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      },
      body: JSON.stringify({ error: (err as Error).message }),
    }
  }
}
