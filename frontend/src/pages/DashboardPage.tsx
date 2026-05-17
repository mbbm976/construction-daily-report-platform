import { useState } from 'react'
import {
  Building2,
  ClipboardCheck,
  ShieldCheck,
  FileText,
  BarChart3,
  Languages,
} from 'lucide-react'

function DashboardPage() {
  const [language, setLanguage] = useState<'mn' | 'en'>('mn')

  const content = {
    mn: {
      badge: 'Stage 2 Frontend эхэлсэн',
      title: 'Барилгын Өдөр Тутмын Тайлан',
      subtitle: 'Талбайн хяналт, ажлын гүйцэтгэл, баталгаажуулалтын платформ',
      language: 'Хэл',
      welcomeTitle: 'Тавтай морил',
      welcomeText:
        'Энэхүү платформ нь барилгын өдөр тутмын тайлан, ажлын явц, ХАБЭА, QA/QC, зураг, зөвшөөрөл, баталгаажуулалт болон экспортын урсгалыг удирдах зориулалттай.',
      backendReady: 'Backend foundation бэлэн',
      dailyReports: 'Өдөр тутмын тайлан',
      dailyReportsText: 'Талбайн ажлын явц, хүн хүч, тоног төхөөрөмж, саатал, зураг бүртгэл.',
      approvals: 'Баталгаажуулалт',
      approvalsText: 'Инженер → Төслийн менежер → Захиалагчийн баталгаажуулалтын урсгал.',
      hseQaqc: 'ХАБЭА / QAQC',
      hseQaqcText: 'Аюулгүй ажиллагаа, чанарын нотолгоо, асуудал болон corrective action бүртгэл.',
      dashboard: 'Удирдлагын самбар',
      dashboardText: 'Тайлангийн төлөв, гүйцэтгэл, KPI болон экспортын хяналт.',
      projectStatus: 'Төслийн ерөнхий төлөв',
      totalReports: 'Нийт тайлан',
      pending: 'Хүлээгдэж буй',
      approved: 'Батлагдсан',
      activeUsers: 'Идэвхтэй хэрэглэгч',
      workflow: 'Тайлангийн workflow',
      create: 'Тайлан үүсгэх',
      pmApprove: 'PM батлах',
      clientApprove: 'Захиалагч батлах',
      archive: 'Архивлах',
    },
    en: {
      badge: 'Stage 2 Frontend Started',
      title: 'Construction Daily Report',
      subtitle: 'Site control, progress tracking, and approval platform',
      language: 'Language',
      welcomeTitle: 'Welcome',
      welcomeText:
        'This platform is designed to manage construction daily reports, progress, HSE, QA/QC, photos, approvals, and export workflows.',
      backendReady: 'Backend foundation ready',
      dailyReports: 'Daily Reports',
      dailyReportsText: 'Record site progress, manpower, equipment, delays, and photos.',
      approvals: 'Approvals',
      approvalsText: 'Engineer → Project Manager → Client approval workflow.',
      hseQaqc: 'HSE / QAQC',
      hseQaqcText: 'Record safety, quality evidence, issues, and corrective actions.',
      dashboard: 'Management Dashboard',
      dashboardText: 'Monitor report status, progress, KPI, and exports.',
      projectStatus: 'Project Overview',
      totalReports: 'Total Reports',
      pending: 'Pending',
      approved: 'Approved',
      activeUsers: 'Active Users',
      workflow: 'Report Workflow',
      create: 'Create Report',
      pmApprove: 'PM Approval',
      clientApprove: 'Client Approval',
      archive: 'Archive',
    },
  }

  const t = content[language]

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div className="hero-badge">
          <Building2 size={16} />
          {t.badge}
        </div>

        <div className="hero-content">
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="language-switcher">
            <div className="language-label">
              <Languages size={16} />
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

      <section className="feature-grid">
        <article className="welcome-card">
          <h2>{t.welcomeTitle}</h2>
          <p>{t.welcomeText}</p>
          <span className="success-badge">{t.backendReady}</span>
        </article>

        <article className="feature-card">
          <FileText className="feature-icon" size={28} />
          <h3>{t.dailyReports}</h3>
          <p>{t.dailyReportsText}</p>
        </article>

        <article className="feature-card">
          <ClipboardCheck className="feature-icon" size={28} />
          <h3>{t.approvals}</h3>
          <p>{t.approvalsText}</p>
        </article>

        <article className="feature-card">
          <ShieldCheck className="feature-icon" size={28} />
          <h3>{t.hseQaqc}</h3>
          <p>{t.hseQaqcText}</p>
        </article>

        <article className="feature-card">
          <BarChart3 className="feature-icon" size={28} />
          <h3>{t.dashboard}</h3>
          <p>{t.dashboardText}</p>
        </article>
      </section>

      <section className="status-card">
        <h2>{t.projectStatus}</h2>

        <div className="status-grid">
          <div className="status-item">
            <FileText size={20} />
            <div>
              <span>{t.totalReports}</span>
              <strong>1</strong>
            </div>
          </div>

          <div className="status-item">
            <ClipboardCheck size={20} />
            <div>
              <span>{t.pending}</span>
              <strong>0</strong>
            </div>
          </div>

          <div className="status-item">
            <ShieldCheck size={20} />
            <div>
              <span>{t.approved}</span>
              <strong>1</strong>
            </div>
          </div>

          <div className="status-item">
            <BarChart3 size={20} />
            <div>
              <span>{t.activeUsers}</span>
              <strong>3</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="workflow-card">
        <h2>{t.workflow}</h2>

        <div className="workflow-grid">
          <div><strong>1</strong>{t.create}</div>
          <div><strong>2</strong>{t.pmApprove}</div>
          <div><strong>3</strong>{t.clientApprove}</div>
          <div><strong>4</strong>{t.archive}</div>
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
