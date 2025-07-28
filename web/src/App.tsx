import React, { useState, useEffect } from 'react'

import AWS from 'aws-sdk'
import {
  Grommet,
  Header,
  Page,
  PageContent,
  Text,
  Button,
  Layer,
  Box,
} from 'grommet'
import { deepMerge } from 'grommet/utils'

import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import EditorPage from 'src/components/EditorPage'
import ImageUploader from 'src/components/ImageUploader'
import ProductDetailPage from 'src/components/ProductDetailPage'
import TitlePage from 'src/components/TitlePage'
import FatalErrorPage from 'src/pages/FatalErrorPage'
import LoginPage from 'src/pages/LoginPage/LoginPage'
import ProfilePage from 'src/pages/ProfilePage/ProfilePage'

const theme = deepMerge({
  global: {
    colors: { brand: '#228BE6' },
    font: { family: 'Roboto', size: '18px', height: '20px' },
  },
})

const REGION = 'us-east-1'
const IDENTITY_POOL_ID = 'us-east-1:77fcf55d-2bdf-4f46-b979-ee71beb59193'
const BUCKET = 'albumgrom'

AWS.config.update({ region: REGION })
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: IDENTITY_POOL_ID,
})
const s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: BUCKET },
})

const IK_URL_ENDPOINT = process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT || ''
const getResizedUrl = (key: string, width = 1000) =>
  `${IK_URL_ENDPOINT}/${encodeURI(key)}?tr=w-${width},fo-face`

interface User {
  name: string
  email: string
  address: string
  postCode: string
  city: string
  phone: string
}

interface AlbumSize {
  label: string
  width: number
  height: number
}

const MainApp = () => {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [view, setView] = useState('login')
  const [user, setUser] = useState<User | null>(null)
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  const [showPrompt, setShowPrompt] = useState(false)
  const [albumSize, setAlbumSize] = useState<AlbumSize | null>(null)

  const handleLogin = (u: User) => {
    setUser(u)
    localStorage.setItem('user', JSON.stringify(u))
    setView('size')
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setView('login')
  }

  useEffect(() => {
    if (albumSize) {
      localStorage.setItem('albumSize', JSON.stringify(albumSize))
    }
  }, [albumSize])

  const createNewSession = async () => {
    if (sessionId) {
      const { Contents } = await s3
        .listObjectsV2({ Prefix: `${sessionId}/` })
        .promise()
      if (Contents && Contents.length) {
        await s3
          .deleteObjects({
            Delete: { Objects: Contents.map((o) => ({ Key: o.Key! })) },
          })
          .promise()
      }
    }
    const sid = Date.now().toString()
    localStorage.setItem('sessionId', sid)
    localStorage.removeItem('albumSize')
    setSessionId(sid)
    setLoadedImages([])
    setAlbumSize(null)
    setView('size')
    setShowPrompt(false)
  }

  const continueSession = async () => {
    const { Contents } = await s3
      .listObjectsV2({ Prefix: `${sessionId}/` })
      .promise()
    const urls = (Contents || []).map((o) => getResizedUrl(o.Key!, 1000))
    setLoadedImages(urls)
    const storedSize = localStorage.getItem('albumSize')
    if (storedSize) {
      setAlbumSize(JSON.parse(storedSize))
      setView('editor')
    } else {
      setView('size')
    }
    setShowPrompt(false)
  }

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
      setView('size')
    } else {
      setView('login')
      return
    }

    const sid = localStorage.getItem('sessionId')
    if (sid) {
      setSessionId(sid)
      const storedSize = localStorage.getItem('albumSize')
      if (storedSize) setAlbumSize(JSON.parse(storedSize))
      s3.listObjectsV2({ Prefix: `${sid}/` })
        .promise()
        .then(({ Contents }) => {
          if (Contents && Contents.length) setShowPrompt(true)
        })
        .catch(console.error)
    } else {
      const newSid = Date.now().toString()
      localStorage.setItem('sessionId', newSid)
      setSessionId(newSid)
      setLoadedImages([])
      setShowPrompt(false)
    }
  }, [])

  if (view === 'login') {
    return (
      <Grommet theme={theme} full>
        <LoginPage onLogin={handleLogin} />
      </Grommet>
    )
  }

  return (
    <Grommet theme={theme} full>
      <Page>
        <Header background="brand" pad="small">
          <Text size="large">FlipSnip</Text>
          <Button
            label={user ? 'Profile' : 'Login'}
            onClick={() => setView(user ? 'profile' : 'login')}
          />
          {user && <Button label="Logout" onClick={handleLogout} />}
        </Header>
        <PageContent pad="large">
          {showPrompt && (
            <Layer
              position="center"
              responsive={false}
              onEsc={() => setShowPrompt(false)}
              onClickOutside={() => setShowPrompt(false)}
            >
              <Box pad="medium" gap="small" style={{ maxWidth: '90vw' }}>
                <Text>Continue your previous session?</Text>
                <Box direction="row" gap="small">
                  <Button label="Continue" primary onClick={continueSession} />
                  <Button label="New Session" onClick={createNewSession} />
                </Box>
              </Box>
            </Layer>
          )}

          {view === 'profile' ? (
            <ProfilePage />
          ) : view === 'size' ? (
            <ProductDetailPage
              onContinue={(size) => {
                setAlbumSize(size)
                setView('upload')
              }}
            />
          ) : view === 'upload' ? (
            <ImageUploader
              sessionId={sessionId as string}
              onContinue={(finishedUploads) => {
                const keys = finishedUploads.map((u) => u.key as string)
                const urls = keys.map((k) => getResizedUrl(k, 1000))
                setLoadedImages(urls)
                setView('title')
              }}
            />
          ) : view === 'title' ? (
            <TitlePage onContinue={() => setView('editor')} />
          ) : view === 'editor' ? (
            <EditorPage
              images={loadedImages}
              onAddImages={(urls) =>
                setLoadedImages((prev) => [...prev, ...urls])
              }
              albumSize={albumSize}
              s3={s3}
              sessionId={sessionId as string}
            />
          ) : null}
        </PageContent>
      </Page>
    </Grommet>
  )
}

const App = () => (
  <FatalErrorBoundary page={FatalErrorPage}>
    <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
      <RedwoodApolloProvider>
        <MainApp />
      </RedwoodApolloProvider>
    </RedwoodProvider>
  </FatalErrorBoundary>
)

export default App
