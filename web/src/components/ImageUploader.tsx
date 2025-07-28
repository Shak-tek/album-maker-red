// src/components/ImageUploader.js
import React, { useEffect, useState, useRef } from 'react'

import { Box, Heading, Text } from 'grommet'

import { presignUpload } from 'src/lib/s3Client'

import GridStep from './GridStep'
import UploadStepContent from './UploadStepContent'

const REGION = 'us-east-1'
const BUCKET = 'albumgrom'
const MAX_IMAGES = 100
const MIN_IMAGES = 20 // ← minimum required photos

// base ImageKit URL used for thumbnails
const IK_URL_ENDPOINT = process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT || ''

// helper to build a resize URL via ImageKit with cache-busting
const getResizedUrl = (key: string, width = 300) =>
  `${IK_URL_ENDPOINT}/${encodeURI(key)}?tr=w-${width},fo-face&v=${Date.now()}`

export interface UploadEntry {
  file: File
  preview: string
  status: string
  progress: number
  uploadUrl: string | null
  key: string | null
}

interface ImageUploaderProps {
  sessionId: string
  onContinue: (uploads: UploadEntry[]) => void
}
export default function ImageUploader({
  sessionId,
  onContinue,
}: ImageUploaderProps) {
  const [uploads, setUploads] = useState<UploadEntry[]>([])
  const [step, setStep] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const updateUpload = (idx: number, fields: Partial<UploadEntry>) =>
    setUploads((all) => {
      const next = [...all]
      next[idx] = { ...next[idx], ...fields }
      return next
    })

  // file picker → add entries (temporary preview until upload finishes)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(
      0,
      MAX_IMAGES - uploads.length
    )
    if (!files.length) {
      e.target.value = ''
      return
    }
    const newEntries = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      uploadUrl: null,
      key: null,
    }))
    setUploads((prev) => [...prev, ...newEntries])
    e.target.value = ''
    setStep(2)
  }

  // perform S3 uploads via presigned URLs and overwrite preview on success
  useEffect(() => {
    if (step !== 2) return

    uploads.forEach((u, idx) => {
      if (u.status !== 'pending') return

      const key = `${sessionId}/${Date.now()}_${u.file.name}`
      updateUpload(idx, { status: 'uploading', key })

      presignUpload(key, u.file.type)
        .then(({ url }) => {
          const xhr = new XMLHttpRequest()
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              updateUpload(idx, {
                progress: Math.round((evt.loaded / evt.total) * 100),
              })
            }
          }
          xhr.onerror = () => updateUpload(idx, { status: 'error' })
          xhr.onload = () => {
            if (xhr.status < 300) {
              const resized = getResizedUrl(key, 300)
              updateUpload(idx, {
                status: 'uploaded',
                uploadUrl: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`,
                preview: resized,
                progress: 100,
              })
            } else {
              updateUpload(idx, { status: 'error' })
            }
          }
          xhr.open('PUT', url)
          xhr.setRequestHeader('Content-Type', u.file.type)
          xhr.send(u.file)
        })
        .catch(() => updateUpload(idx, { status: 'error' }))
    })
  }, [step, uploads, sessionId])

  // counts & ready-flags
  const photosUploaded = uploads.filter((u) => u.status === 'uploaded').length
  const allUploaded =
    uploads.length > 0 && uploads.every((u) => u.status === 'uploaded')
  const readyToContinue = allUploaded && photosUploaded >= MIN_IMAGES

  return (
    <div className="StyledGrommet-sc-19lkkz7-0 daORNg">
      <div className="StyledBox-sc-13pk1d4-0 ejlvja sc-8340680b-0 jylZUp">
        {/* page header */}
        <Box gap="small" pad={{ horizontal: 'medium', top: 'medium' }}>
          <Heading level={2} size="xlarge" margin="none">
            Upload Photos
          </Heading>
          <Text size="small" color="dark-5">
            Select the photos you would like to print to make your Photo Book.
          </Text>
        </Box>

        <Box pad="medium">
          <Box data-cy="uploadDropzone">
            <Box
              animation={[
                { type: 'fadeOut', duration: 200 },
                { type: 'fadeIn', duration: 200 },
              ]}
            >
              {step === 1 ? (
                <UploadStepContent fileInputRef={fileInputRef} />
              ) : (
                <GridStep
                  uploads={uploads}
                  photosUploaded={photosUploaded}
                  minImages={MIN_IMAGES}
                  allDone={readyToContinue}
                  onBack={() => setStep(1)}
                  onContinue={() => {
                    if (readyToContinue) onContinue(uploads)
                  }}
                  fileInputRef={fileInputRef}
                  // retry a failed thumbnail by regenerating the preview URL
                  onImageError={(idx) => {
                    const u = uploads[idx]
                    updateUpload(idx, {
                      preview: getResizedUrl(u.key, 300),
                    })
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>
      </div>

      {/* single hidden input always mounted */}
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/tiff,image/gif,image/webp,image/heic,image/heif"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  )
}
