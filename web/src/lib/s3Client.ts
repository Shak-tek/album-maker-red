const BASE = '/.netlify/functions'

async function request(body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/s3`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
  }
  return res.json()
}

export const listObjects = (
  prefix: string
): Promise<{ contents: Array<{ Key?: string }> }> =>
  request({ action: 'list', prefix })

export const deleteObjects = (keys: string[]): Promise<{ success: boolean }> =>
  request({ action: 'delete', keys })

export const presignUpload = (
  key: string,
  contentType: string
): Promise<{ url: string }> =>
  request({ action: 'presignUpload', key, contentType })
