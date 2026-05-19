import {
  createInitialDailyReportFormData,
  type DailyReportFormData,
} from '../../../types/dailyReport'

const LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY =
  'construction-daily-report:legacy-daily-report-draft:v1'

const STORAGE_VERSION = 1

type StoredLegacyDailyReportDraft = {
  version: typeof STORAGE_VERSION
  savedAt: string
  data: DailyReportFormData
}

export type LegacyDailyReportDraftSnapshot = {
  savedAt: string
  data: DailyReportFormData
  persisted: boolean
  warning?: string
}

const canUseLocalStorage = (): boolean =>
  typeof window !== 'undefined' && typeof Storage !== 'undefined'

const normalizeDailyReportDraft = (
  data: Partial<DailyReportFormData>
): DailyReportFormData => {
  const initialDailyReportFormData = createInitialDailyReportFormData()

  return {
  ...initialDailyReportFormData,
  ...data,
  manpower: {
    ...initialDailyReportFormData.manpower,
    ...data.manpower,
  },
  workItems: data.workItems ?? initialDailyReportFormData.workItems,
  equipmentItems:
    data.equipmentItems ?? initialDailyReportFormData.equipmentItems,
  hse: {
    ...initialDailyReportFormData.hse,
    ...data.hse,
  },
  qualityChecks: data.qualityChecks ?? initialDailyReportFormData.qualityChecks,
}
}

export const saveLegacyDailyReportDraft = (
  data: DailyReportFormData
): LegacyDailyReportDraftSnapshot => {
  const snapshot: StoredLegacyDailyReportDraft = {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    data: normalizeDailyReportDraft(data),
  }

  if (!canUseLocalStorage()) {
    return {
      savedAt: snapshot.savedAt,
      data: snapshot.data,
      persisted: false,
      warning: 'Local storage is unavailable in this browser context.',
    }
  }

  try {
    window.localStorage.setItem(
      LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY,
      JSON.stringify(snapshot)
    )

    return {
      savedAt: snapshot.savedAt,
      data: snapshot.data,
      persisted: true,
    }
  } catch (error) {
    console.warn('Unable to save local daily report draft:', error)
    return {
      savedAt: snapshot.savedAt,
      data: snapshot.data,
      persisted: false,
      warning:
        'Local storage quota exceeded or unavailable. Draft could not be persisted.',
    }
  }
}

export const loadLegacyDailyReportDraft = ():
  | LegacyDailyReportDraftSnapshot
  | null => {
  if (!canUseLocalStorage()) {
    return null
  }

  const storedValue = window.localStorage.getItem(
    LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY
  )

  if (!storedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<
      StoredLegacyDailyReportDraft
    >

    if (
      parsedValue.version === STORAGE_VERSION &&
      parsedValue.data &&
      typeof parsedValue.savedAt === 'string'
    ) {
      return {
        savedAt: parsedValue.savedAt,
        data: normalizeDailyReportDraft(parsedValue.data),
        persisted: true,
      }
    }

    return null
  } catch (error) {
    console.warn('Unable to load local daily report draft:', error)
    return null
  }
}

export const clearLegacyDailyReportDraft = () => {
  if (!canUseLocalStorage()) {
    return
  }

  window.localStorage.removeItem(LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY)
}
