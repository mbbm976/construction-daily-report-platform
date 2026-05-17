import { useEffect, useState } from 'react'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DailyReportFormPage from './pages/DailyReportFormPage'

type AppPage = 'dashboard' | 'dailyReportForm'

function App() {
  const [page, setPage] = useState<AppPage>('dashboard')
  const { user, loading, initialize, signOut } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return <div style={{ padding: 24 }}>Ачааллаж байна...</div>
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <main style={{ minHeight: '100vh', background: '#eef4ff' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: 24 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>
              Construction Daily Report
            </div>
            <h1 style={{ margin: 0, fontSize: 26 }}>
              Барилгын өдөр тутмын тайлан
            </h1>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setPage('dashboard')}>
              Нүүр хуудас
            </button>

            <button type="button" onClick={() => setPage('dailyReportForm')}>
              Тайлан үүсгэх
            </button>

            <button type="button" onClick={() => void signOut()}>
              Гарах
            </button>
          </div>
        </header>

        {page === 'dailyReportForm' ? <DailyReportFormPage /> : <DashboardPage />}
      </div>
    </main>
  )
}

export default App
