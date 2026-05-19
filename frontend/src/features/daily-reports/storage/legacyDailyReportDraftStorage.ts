import {
  createInitialDailyReportFormData,
  type DailyReportFormData,
} from '../../../types/dailyReport'

// Legacy local-only bridge keying strategy.
// Stage 2.x has no production organizationId/projectId/reportId in the form yet.
// Future production persistence must scope storage by those real identifiers.
const LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY_PREFIX =
  'construction-daily-report:legacy-daily-report-draft:v1'
const LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY =
  'construction-daily-report:legacy-daily-report-draft:latest:v1'

const STORAGE_VERSION = 1

type StoredLegacyDailyReportDraft = {
  version: typeof STORAGE_VERSION
  savedAt: string
  key: string
  data: DailyReportFormData
}

export type LegacyDailyReportDraftSnapshot = {
  savedAt: string
  data: DailyReportFormData
  persisted: boolean
  warning?: string
}

const getLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage ?? null
  } catch {
    return null
  }
}

const normalizeKeySegment = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '-')
  return normalized.length > 0 ? normalized : 'unknown-site'
}

const buildDraftStorageKey = (data: DailyReportFormData): string => {
  const reportDate = (data.reportDate || 'unknown-date').trim() || 'unknown-date'
  const site = normalizeKeySegment(data.projectSiteName)

  return `${LEGACY_DAILY_REPORT_DRAFT_STORAGE_KEY_PREFIX}:${reportDate}:${site}`
}

const normalizeDailyReportDraft = (
  data: Partial<DailyReportFormData>
): DailyReportFormData => {
  const defaultFormData = createInitialDailyReportFormData()

  return {
    ...defaultFormData,
    ...data,
    manpower: {
      ...defaultFormData.manpower,
      ...data.manpower,
    },
    workItems: data.workItems ?? defaultFormData.workItems,
    equipmentItems:
      data.equipmentItems ?? defaultFormData.equipmentItems,
    hse: {
      ...defaultFormData.hse,
      ...data.hse,
    },
    qualityChecks:
      data.qualityChecks ?? defaultFormData.qualityChecks,
  }
}

const clearDraftAndMaybeLatestIndex = (
  localStorage: Storage,
  draftStorageKey: string,
  clearLatestIndexWhenMatching: boolean
) => {
  localStorage.removeItem(draftStorageKey)

  if (!clearLatestIndexWhenMatching) {
    return
  }

  const latestDraftKey = localStorage.getItem(
    LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY
  )

  if (latestDraftKey === draftStorageKey) {
    localStorage.removeItem(LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY)
  }
}

export const saveLegacyDailyReportDraft = (
  data: DailyReportFormData
): LegacyDailyReportDraftSnapshot => {
  const draftStorageKey = buildDraftStorageKey(data)

  const snapshot: StoredLegacyDailyReportDraft = {
    version: STORAGE_VERSION,
    savedAt: new Date().toISOString(),
    key: draftStorageKey,
    data: normalizeDailyReportDraft(data),
  }

  const localStorage = getLocalStorage()

  if (!localStorage) {
    return {
      savedAt: snapshot.savedAt,
      data: snapshot.data,
      persisted: false,
      warning: 'Local storage is unavailable in this browser context.',
    }
  }

  try {
    localStorage.setItem(draftStorageKey, JSON.stringify(snapshot))
    localStorage.setItem(LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY, draftStorageKey)

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
  const localStorage = getLocalStorage()

  if (!localStorage) {
    return null
  }

  const latestDraftStorageKey = localStorage.getItem(
    LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY
  )

  if (!latestDraftStorageKey) {
    return null
  }

  const storedValue = localStorage.getItem(latestDraftStorageKey)

  if (!storedValue) {
    localStorage.removeItem(LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY)
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue) as Partial<
      StoredLegacyDailyReportDraft
    >

    if (
      parsedValue.version === STORAGE_VERSION &&
      parsedValue.data &&
      typeof parsedValue.savedAt === 'string' &&
      typeof parsedValue.key === 'string'
    ) {
      return {
        savedAt: parsedValue.savedAt,
        data: normalizeDailyReportDraft(parsedValue.data),
        persisted: true,
      }
    }

    clearDraftAndMaybeLatestIndex(localStorage, latestDraftStorageKey, true)
    return null
  } catch (error) {
    console.warn('Unable to load local daily report draft:', error)
    clearDraftAndMaybeLatestIndex(localStorage, latestDraftStorageKey, true)
    return null
  }
}

export const clearLegacyDailyReportDraft = (data?: DailyReportFormData) => {
  const localStorage = getLocalStorage()

  if (!localStorage) {
    return
  }

  const draftStorageKey = data
    ? buildDraftStorageKey(data)
    : localStorage.getItem(LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY)

  if (!draftStorageKey) {
    localStorage.removeItem(LEGACY_DAILY_REPORT_LATEST_INDEX_STORAGE_KEY)
    return
  }

  clearDraftAndMaybeLatestIndex(localStorage, draftStorageKey, true)
}
