import type {
  BaseEntity,
  EntityId,
  ISODateString,
  ISODateTimeString,
  PolymorphicSource,
} from './common'

export type NcrSeverity = 'Low' | 'Medium' | 'High' | 'Critical'

export type NcrStatus =
  | 'Open'
  | 'InReview'
  | 'CorrectiveActionRequired'
  | 'Closed'
  | 'Rejected'
  | 'Archived'

export type CorrectiveActionStatus =
  | 'Open'
  | 'Assigned'
  | 'InProgress'
  | 'Completed'
  | 'Verified'
  | 'Closed'
  | 'Overdue'
  | 'Cancelled'

/**
 * Non-conformance record sourced from another project-control entity.
 *
 * `source` must be a PolymorphicSource so the NCR has exactly one origin record
 * without parallel source-specific fields. Stage 2.2 does not implement NCR UI,
 * business logic, Supabase migrations, RPC validation, or database triggers.
 */
export interface NcrRecord extends BaseEntity {
  source: PolymorphicSource
  title: string
  description: string
  severity: NcrSeverity
  status: NcrStatus
  assignedTo?: EntityId
  dueDate?: ISODateString
  closedAt?: ISODateTimeString
  closedBy?: EntityId
  locationId?: EntityId
  workAreaId?: EntityId
  tradeId?: EntityId
  activityId?: EntityId
  rootCause?: string
  correctiveActionRequired?: boolean
}

/**
 * Corrective action record sourced from an NCR, inspection result, manual entry,
 * or another accepted PolymorphicSource target.
 *
 * Completion evidence must later use Attachment with `entityType` set to the
 * corrective action target and `entityId` set to this record's ID. This type does
 * not embed evidence relationship arrays.
 */
export interface CorrectiveAction extends BaseEntity {
  source: PolymorphicSource
  title: string
  description: string
  assignedTo?: EntityId
  dueDate?: ISODateString
  status: CorrectiveActionStatus
  completedAt?: ISODateTimeString
  verifiedAt?: ISODateTimeString
  closedAt?: ISODateTimeString
  closedBy?: EntityId
  verificationNotes?: string
}
