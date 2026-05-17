export type DailyReportStatus = 'draft' | 'submitted'

export type ShiftType = 'day' | 'night' | 'other'

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'windy'
  | 'storm'
  | 'other'

export type WorkCategory =
  | 'earthworks'
  | 'concrete'
  | 'steel_structure'
  | 'mechanical'
  | 'electrical'
  | 'piping'
  | 'roadworks'
  | 'civil'
  | 'demolition'
  | 'inspection'
  | 'other'

export type QuantityUnit =
  | 'm3'
  | 'm2'
  | 'm'
  | 'ton'
  | 'kg'
  | 'pcs'
  | 'hr'
  | 'day'
  | 'percent'
  | 'other'

export type YesNo = 'yes' | 'no'

export type EquipmentStatus =
  | 'working'
  | 'idle'
  | 'breakdown'
  | 'maintenance'

export type QualityResult =
  | 'passed'
  | 'failed'
  | 'hold'
  | 'not_applicable'

export type CorrectiveActionStatus =
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'not_required'

export type ManpowerSummary = {
  plannedManpower: number
  actualManpower: number
  totalWorkHours: number
  contractorName: string
  supervisorName: string
}

export type WorkProgressItem = {
  id: string
  workCategory: WorkCategory | ''
  wbsActivityCode: string
  locationArea: string
  description: string
  plannedQuantity: number
  actualQuantity: number
  unit: QuantityUnit | ''
  progressPercent: number
  remarks: string
}

export type EquipmentItem = {
  id: string
  equipmentName: string
  equipmentNumber: string
  status: EquipmentStatus | ''
  workingHours: number
  breakdownHours: number
  remarks: string
}

export type HseSection = {
  toolboxTalkHeld: YesNo | ''
  toolboxTopic: string
  permitRequired: YesNo | ''
  permitNumbers: string

  incidentOccurred: YesNo | ''
  incidentType: string
  incidentDescription: string

  nearMissOccurred: YesNo | ''
  safetyObservation: string
  unsafeConditionCount: number
  unsafeActCount: number

  correctiveActionRequired: YesNo | ''
  correctiveActionDescription: string
  correctiveActionStatus: CorrectiveActionStatus | ''
}

export type QualityCheck = {
  id: string
  inspectionType: string
  result: QualityResult | ''
  nonConformanceFound: YesNo | ''
  ncrNumber: string
  remarks: string
}

export type DailyReportFormData = {
  reportDate: string
  projectSiteName: string
  preparedBy: string

  shiftType: ShiftType | ''
  shiftStartTime: string
  shiftEndTime: string

  weatherCondition: WeatherCondition | ''
  weatherRemarks: string

  // Temporary MVP compatibility fields.
  // These keep the current form working while we migrate to structured sections.
  manpowerCount: number
  workCompleted: string
  safetyObservation: string
  equipment: string
  attachmentNote: string

  status: DailyReportStatus

  manpower: ManpowerSummary
  workItems: WorkProgressItem[]
  equipmentItems: EquipmentItem[]
  hse: HseSection
  qualityChecks: QualityCheck[]
}

const today = new Date().toISOString().slice(0, 10)

export const initialDailyReportFormData: DailyReportFormData = {
  reportDate: today,
  projectSiteName: '',
  preparedBy: '',

  shiftType: '',
  shiftStartTime: '',
  shiftEndTime: '',

  weatherCondition: '',
  weatherRemarks: '',

  manpowerCount: 0,
  workCompleted: '',
  safetyObservation: '',
  equipment: '',
  attachmentNote: '',

  status: 'draft',

  manpower: {
    plannedManpower: 0,
    actualManpower: 0,
    totalWorkHours: 0,
    contractorName: '',
    supervisorName: '',
  },

  workItems: [
    {
      id: 'work-item-1',
      workCategory: '',
      wbsActivityCode: '',
      locationArea: '',
      description: '',
      plannedQuantity: 0,
      actualQuantity: 0,
      unit: '',
      progressPercent: 0,
      remarks: '',
    },
  ],

  equipmentItems: [
    {
      id: 'equipment-item-1',
      equipmentName: '',
      equipmentNumber: '',
      status: '',
      workingHours: 0,
      breakdownHours: 0,
      remarks: '',
    },
  ],

  hse: {
    toolboxTalkHeld: '',
    toolboxTopic: '',
    permitRequired: '',
    permitNumbers: '',

    incidentOccurred: '',
    incidentType: '',
    incidentDescription: '',

    nearMissOccurred: '',
    safetyObservation: '',
    unsafeConditionCount: 0,
    unsafeActCount: 0,

    correctiveActionRequired: '',
    correctiveActionDescription: '',
    correctiveActionStatus: '',
  },

  qualityChecks: [
    {
      id: 'quality-check-1',
      inspectionType: '',
      result: '',
      nonConformanceFound: '',
      ncrNumber: '',
      remarks: '',
    },
  ],
}
