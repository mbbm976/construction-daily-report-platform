import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'

function App() {
  const { user, loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <main className="app-shell">
        <section className="card">
          <p>Ачааллаж байна...</p>
        </section>
      </main>
    )
  }

  return user ? <DashboardPage /> : <LoginPage />
}

export default App
