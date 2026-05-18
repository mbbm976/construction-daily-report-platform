import type { EntityId, ISODateString } from './common'

/**
 * Read-only daily dashboard metrics.
 *
 * These interfaces represent computed results from future Supabase Views, RPCs,
 * materialized views, or Edge Functions. Dynamic dashboard metrics should not be
 * stored directly in DailyReport records, and this file intentionally contains
 * no calculation logic.
 */
export interface DailyDashboardMetrics {
  organizationId: EntityId
  projectId: EntityId
  reportDate: ISODateString
  dailyReportCount: number
  submittedReportCount: number
  approvedReportCount: number
  manpowerTotal: number
  equipmentTotal: number
  delayHours: number
  inspectionPassedCount: number
  inspectionFailedCount: number
  openNcrCount: number
  openCorrectiveActionCount: number
  safetyIncidentCount: number
  plannedProgressPercent?: number
  actualProgressPercent?: number
}

/**
 * Read-only project metric snapshot.
 *
 * Snapshot tables may be introduced later only when the product intentionally
 * needs historical analytics snapshots. Stage 2.2 defines the result shape only;
 * it does not implement dashboards, aggregation jobs, RPCs, views, or Edge
 * Functions.
 */
export interface ProjectMetricSnapshot {
  organizationId: EntityId
  projectId: EntityId
  snapshotDate: ISODateString
  plannedProgressPercent?: number
  actualProgressPercent?: number
  manpowerTotal?: number
  equipmentTotal?: number
  openNcrCount?: number
  openCorrectiveActionCount?: number
  delayHours?: number
  inspectionPassRate?: number
  safetyIncidentCount?: number
}
