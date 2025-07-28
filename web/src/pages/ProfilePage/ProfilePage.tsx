import { useEffect, useState } from 'react'

interface User {
  name: string
  email: string
  address: string
  postCode: string
  city: string
  phone: string
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
  }, [])

  if (!user) {
    return <p>No user logged in.</p>
  }

  return (
    <main>
      <h1>Profile</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </main>
  )
}

export default ProfilePage
