export type DailyReportStatus = 'draft' | 'submitted'

export type DailyReportFormData = {
  reportDate: string
  projectSiteName: string
  preparedBy: string
  manpowerCount: number
  workCompleted: string
  safetyObservation: string
  equipment: string
  attachmentNote: string
  status: DailyReportStatus
}

export const initialDailyReportFormData: DailyReportFormData = {
  reportDate: new Date().toISOString().slice(0, 10),
  projectSiteName: '',
  preparedBy: '',
  manpowerCount: 0,
  workCompleted: '',
  safetyObservation: '',
  equipment: '',
  attachmentNote: '',
  status: 'draft',
}
