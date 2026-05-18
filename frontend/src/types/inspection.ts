import type {
  BaseEntity,
  EntityId,
  ISODateString,
  ISODateTimeString,
  PolymorphicSource,
} from './common'

export type InspectionResponseType =
  | 'pass_fail_na'
  | 'yes_no'
  | 'text'
  | 'number'
  | 'photo'
  | 'signature'
  | 'date'
  | 'select'

export type InspectionReportStatus =
  | 'Draft'
  | 'InProgress'
  | 'Submitted'
  | 'Approved'
  | 'Returned'
  | 'Rejected'
  | 'Archived'

export type InspectionResultStatus =
  | 'Pass'
  | 'Fail'
  | 'NA'
  | 'AcceptedWithComments'
  | 'ReInspectionRequired'

export interface InspectionOption {
  value: string
  label: string
  sortOrder?: number
}

/**
 * Type-level architecture for reusable inspection templates.
 *
 * Stage 2.2 only defines data contracts. It does not implement inspection UI,
 * workflow logic, Supabase migrations, RPC validation, or database triggers.
 */
export interface InspectionTemplate extends BaseEntity {
  name: string
  description?: string
  disciplineId?: EntityId
  tradeId?: EntityId
  isActive: boolean
  templateVersion: number
}

export interface InspectionSection extends BaseEntity {
  templateId: EntityId
  title: string
  description?: string
  sortOrder: number
}

export interface InspectionItem extends BaseEntity {
  templateId: EntityId
  sectionId: EntityId
  questionText: string
  responseType: InspectionResponseType
  required: boolean
  sortOrder: number
  helpText?: string
  options?: InspectionOption[]
}

/**
 * Inspection report header linked with foreign-key-style identifiers.
 * Evidence files for photo/signature responses should later use the shared
 * Attachment entity with `entityType`/`entityId` polymorphic targeting.
 */
export interface InspectionReport extends BaseEntity {
  templateId: EntityId
  sourceDailyReportId?: EntityId
  reportDate: ISODateString
  locationId?: EntityId
  workAreaId?: EntityId
  activityId?: EntityId
  status: InspectionReportStatus
  inspectedBy?: EntityId
  inspectedAt?: ISODateTimeString
  submittedBy?: EntityId
  submittedAt?: ISODateTimeString
  approvedBy?: EntityId
  approvedAt?: ISODateTimeString
  returnedAt?: ISODateTimeString
  returnedReason?: string
  notes?: string
}

/**
 * Inspection result row for a single checklist item.
 *
 * `source` is optional and may be used when a result originates from another
 * project-control record. Failed results can later generate NCRs or corrective
 * actions by storing a PolymorphicSource on those records. This file does not
 * implement generation logic.
 */
export interface InspectionResult extends BaseEntity {
  inspectionReportId: EntityId
  inspectionItemId: EntityId
  status: InspectionResultStatus
  responseText?: string
  responseNumber?: number
  responseBoolean?: boolean
  selectedOption?: string
  comments?: string
  source?: PolymorphicSource
}
