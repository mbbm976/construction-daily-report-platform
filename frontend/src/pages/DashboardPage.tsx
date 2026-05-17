import { useState } from 'react'
import {
  Building2,
  ClipboardCheck,
  ShieldCheck,
  FileText,
  BarChart3,
  Languages,
  Users,
  CheckCircle2,
  Clock3,
} from 'lucide-react'
import './App.css'

type Language = 'mn' | 'en'

const content = {
  mn: {
    systemName: 'Барилгын Өдөр Тутмын Тайлан',
    subtitle: 'Талбайн хяналт, ажлын гүйцэтгэл, баталгаажуулалтын платформ',
    language: 'Хэл',
    badge: 'Stage 2 Frontend эхэлсэн',
    welcomeTitle: 'Тавтай морил',
    welcomeText:
      'Энэхүү платформ нь барилгын өдөр тутмын тайлан, ажлын явц, ХАБЭА, QA/QC, зураг, зөвшөөрөл, баталгаажуулалт болон экспортын урсгалыг удирдах зориулалттай.',
    dailyReports: 'Өдөр тутмын тайлан',
    dailyReportsText: 'Талбайн ажлын явц, хүн хүч, тоног төхөөрөмж, саатал, зураг бүртгэл.',
    approvals: 'Баталгаажуулалт',
    approvalsText: 'Инженер → Төслийн менежер → Захиалагчийн баталгаажуулалтын урсгал.',
    hseQaqc: 'ХАБЭА / QAQC',
    hseQaqcText: 'Аюулгүй ажиллагаа, чанарын нотолгоо, асуудал болон corrective action бүртгэл.',
    dashboard: 'Удирдлагын самбар',
    dashboardText: 'Тайлангийн төлөв, гүйцэтгэл, KPI болон экспортын хяналт.',
    statsTitle: 'Төслийн ерөнхий төлөв',
    totalReports: 'Нийт тайлан',
    pendingApproval: 'Хүлээгдэж буй',
    approvedReports: 'Батлагдсан',
    activeUsers: 'Идэвхтэй хэрэглэгч',
    workflowTitle: 'Тайлангийн workflow',
    step1: 'Тайлан үүсгэх',
    step2: 'PM батлах',
    step3: 'Захиалагч батлах',
    step4: 'Архивлах',
    ready: 'Backend foundation бэлэн',
  },
  en: {
    systemName: 'Construction Daily Report',
    subtitle: 'Site control, progress reporting, and approval workflow platform',
    language: 'Language',
    badge: 'Stage 2 Frontend Started',
    welcomeTitle: 'Welcome',
    welcomeText:
      'This platform is designed to manage construction daily reports, site progress, HSE, QA/QC, photos, approvals, evidence records, dashboards, and export workflows.',
    dailyReports: 'Daily Reports',
    dailyReportsText: 'Site progress, manpower, equipment, delays, photos, and daily records.',
    approvals: 'Approvals',
    approvalsText: 'Engineer → Project Manager → Client representative approval workflow.',
    hseQaqc: 'HSE / QAQC',
    hseQaqcText: 'Safety, quality evidence, issues, corrective actions, and compliance records.',
    dashboard: 'Dashboard',
    dashboardText: 'Report status, progress, KPI, approval, and export monitoring.',
    statsTitle: 'Project Overview',
    totalReports: 'Total Reports',
    pendingApproval: 'Pending Approval',
    approvedReports: 'Approved',
    activeUsers: 'Active Users',
    workflowTitle: 'Report Workflow',
    step1: 'Create Report',
    step2: 'PM Approval',
    step3: 'Client Approval',
    step4: 'Archive',
    ready: 'Backend foundation ready',
  },
}

function DashboardPage() {
  const [language, setLanguage] = useState<Language>('mn')
  const t = content[language]

  const cards = [
    {
      icon: <FileText size={30} />,
      title: t.dailyReports,
      text: t.dailyReportsText,
    },
    {
      icon: <ClipboardCheck size={30} />,
      title: t.approvals,
      text: t.approvalsText,
    },
    {
      icon: <ShieldCheck size={30} />,
      title: t.hseQaqc,
      text: t.hseQaqcText,
    },
    {
      icon: <BarChart3 size={30} />,
      title: t.dashboard,
      text: t.dashboardText,
    },
  ]

  const stats = [
    { label: t.totalReports, value: '1', icon: <FileText size={22} /> },
    { label: t.pendingApproval, value: '0', icon: <Clock3 size={22} /> },
    { label: t.approvedReports, value: '1', icon: <CheckCircle2 size={22} /> },
    { label: t.activeUsers, value: '3', icon: <Users size={22} /> },
  ]

  const workflow = [t.step1, t.step2, t.step3, t.step4]

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-badge">
          <Building2 size={18} />
          <span>{t.badge}</span>
        </div>

        <div className="hero-content">
          <div>
            <h1>{t.systemName}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="language-switch">
            <div className="language-label">
              <Languages size={20} />
              <span>{t.language}</span>
            </div>

            <div className="language-buttons">
              <button
                className={language === 'mn' ? 'active' : ''}
                onClick={() => setLanguage('mn')}
              >
                Монгол
              </button>
              <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="overview-grid">
        <div className="welcome-card">
          <h2>{t.welcomeTitle}</h2>
          <p>{t.welcomeText}</p>
          <div className="status-pill">
            <CheckCircle2 size={18} />
            <span>{t.ready}</span>
          </div>
        </div>

        {cards.map((card) => (
          <div className="feature-card" key={card.title}>
            <div className="feature-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </div>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="section-header">
          <h2>{t.statsTitle}</h2>
        </div>

        <div className="stats-grid">
          {stats.map((item) => (
            <div className="stat-card" key={item.label}>
              <div className="stat-icon">{item.icon}</div>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="workflow-section">
        <div className="section-header">
          <h2>{t.workflowTitle}</h2>
        </div>

        <div className="workflow">
          {workflow.map((step, index) => (
            <div className="workflow-step" key={step}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default DashboardPage