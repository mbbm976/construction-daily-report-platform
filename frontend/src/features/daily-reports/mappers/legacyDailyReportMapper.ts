import type {
  DailyReportFormData,
  DailyReportStatus,
  EquipmentSummary,
  ManpowerSummary,
  SafetySummary,
  WorkActivitySummary,
} from '../../../types/dailyReport'

type LegacyDailyReportNotes = {
  projectSiteName: string
  preparedBy: string
  shiftType: DailyReportFormData['shiftType']
  shiftStartTime: string
  shiftEndTime: string
  weatherRemarks: string
  attachmentNote: string
}

export type LegacyMappedDailyReportDraft = {
  reportDate: DailyReportFormData['reportDate']
  status: Extract<DailyReportStatus, 'Draft' | 'Submitted'>
  weatherCondition?: string
  workSummary: WorkActivitySummary
  manpowerSummary: ManpowerSummary
  equipmentSummary: EquipmentSummary
  safetySummary: SafetySummary
  legacyNotes: LegacyDailyReportNotes
}

const mapLegacyStatusToProductionStatus = (
  status: DailyReportFormData['status']
): LegacyMappedDailyReportDraft['status'] => {
  if (status === 'submitted') {
    return 'Submitted'
  }

  return 'Draft'
}

const mergeSafetyNotes = (...notes: string[]): string | undefined => {
  const mergedNotes = notes
    .map((note) => note.trim())
    .filter((note) => note.length > 0)

  if (mergedNotes.length === 0) {
    return undefined
  }

  return mergedNotes.join('\n')
}

/**
 * Stage 2.3 transitional bridge from the current Stage 2.1 local form model to
 * a production-oriented draft shape.
 *
 * This mapper is pure and side-effect free. It does not create persisted
 * DailyReport records and intentionally leaves out production-only backend
 * fields such as organizationId, projectId, reportNumber, BaseEntity metadata,
 * and approval metadata. Those values will be injected later by application and
 * backend workflows, including backend report number generation.
 *
 * Keeping this as a partial draft avoids forcing production-only requirements
 * into the current Stage 2.1 UI while preserving the information the current
 * form captures.
 */
export const mapLegacyDailyReportFormToProductionDraft = (
  input: DailyReportFormData
): LegacyMappedDailyReportDraft => ({
  reportDate: input.reportDate,
  status: mapLegacyStatusToProductionStatus(input.status),
  weatherCondition: input.weatherCondition || undefined,
  workSummary: {
    description: input.workCompleted,
  },
  manpowerSummary: {
    totalWorkers: input.manpowerCount,
    notes: input.manpower.contractorName || input.manpower.supervisorName
      ? [
          input.manpower.contractorName &&
            `Contractor: ${input.manpower.contractorName}`,
          input.manpower.supervisorName &&
            `Supervisor: ${input.manpower.supervisorName}`,
        ]
          .filter(Boolean)
          .join('\n')
      : undefined,
    entries: [
      {
        workerCount: input.manpowerCount,
        regularHours: input.manpower.totalWorkHours || undefined,
      },
    ],
  },
  equipmentSummary: {
    totalEquipment: input.equipment.trim() ? 1 : 0,
    notes: input.equipment || undefined,
  },
  safetySummary: {
    incidentCount: input.hse.incidentOccurred === 'yes' ? 1 : 0,
    observationCount: input.safetyObservation.trim() ? 1 : 0,
    notes: mergeSafetyNotes(input.safetyObservation, input.hse.safetyObservation),
  },
  legacyNotes: {
    projectSiteName: input.projectSiteName,
    preparedBy: input.preparedBy,
    shiftType: input.shiftType,
    shiftStartTime: input.shiftStartTime,
    shiftEndTime: input.shiftEndTime,
    weatherRemarks: input.weatherRemarks,
    attachmentNote: input.attachmentNote,
  },
})
