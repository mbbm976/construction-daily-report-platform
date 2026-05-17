import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
  const { signIn, loading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await signIn(email, password)
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-badge">Construction Daily Report</div>

        <h1>Нэвтрэх</h1>
        <p>Өдөр тутмын тайлангийн платформд нэвтэрнэ үү.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Имэйл
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              required
            />
          </label>

          <label>
            Нууц үг
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Нэвтэрч байна...' : 'Нэвтрэх'}
          </button>
        </form>
      </section>
    </main>
  )
}
