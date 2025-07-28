import { useState } from 'react'

import { navigate } from '@redwoodjs/router'

const SignupPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    address: '',
    postCode: '',
    city: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      navigate('/login')
    } else {
      const text = await res.text()
      setError(text)
    }
  }

  return (
    <main>
      <h1>Sign Up</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            Email
            <input name="email" value={form.email} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Post Code
            <input
              name="postCode"
              value={form.postCode}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            City
            <input name="city" value={form.city} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
        </div>
        <div>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit">Sign Up</button>
      </form>
    </main>
  )
}

export default SignupPage
