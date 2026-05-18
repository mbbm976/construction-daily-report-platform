export type EntityId = string
export type ISODateString = string
export type ISODateTimeString = string

export type SyncStatus = 'Synced' | 'PendingSync' | 'SyncFailed'

export type CurrencyCode = 'MNT' | 'USD' | 'AUD' | 'SGD' | 'AED' | 'EUR' | 'GBP'

export type MeasurementSystem = 'metric' | 'imperial'

export type SubscriptionTier = 'starter' | 'professional' | 'enterprise'

export type DataResidencyRegion = 'mn' | 'us' | 'eu' | 'au' | 'sg' | 'ae'

/**
 * Production base entity for tenant-scoped project control records.
 *
 * Construction records should use soft delete (`isDeleted`, `deletedAt`,
 * `deletedBy`) instead of physical delete so audit history, analytics, exports,
 * and future compliance reviews remain reliable.
 *
 * Returned/resubmitted records should use version progression through
 * `versionNumber` and `previousVersionId` rather than overwriting history.
 *
 * Optimistic locking should compare `updatedAt` and/or `versionNumber` before
 * saving to prevent overwriting another user's changes.
 *
 * `clientGeneratedId`, `capturedAt`, and `syncStatus` keep the model ready for
 * mobile/offline field reporting without requiring sync infrastructure in the
 * current stage.
 */
export interface BaseEntity {
  id: EntityId
  organizationId: EntityId
  projectId?: EntityId
  createdBy: EntityId
  createdAt: ISODateTimeString
  updatedAt: ISODateTimeString
  isDeleted: boolean
  deletedAt?: ISODateTimeString
  deletedBy?: EntityId
  versionNumber: number
  previousVersionId?: EntityId
  clientGeneratedId?: EntityId
  capturedAt?: ISODateTimeString
  syncStatus?: SyncStatus
}

export interface TenantConfig {
  organizationId: EntityId
  defaultCurrencyCode: CurrencyCode
  measurementSystem: MeasurementSystem
  timezone: string
  locale: string
  dataResidencyRegion: DataResidencyRegion
  subscriptionTier: SubscriptionTier
  maxProjects?: number
  maxUsersPerProject?: number
  storageQuotaGB?: number
}

export type SourceType =
  | 'daily_report'
  | 'inspection_report'
  | 'inspection_result'
  | 'ncr'
  | 'corrective_action'
  | 'manual'

/**
 * Polymorphic source reference.
 *
 * PostgreSQL cannot enforce a traditional foreign key across multiple possible
 * target tables for `sourceType`/`sourceId`. Later integrity must be enforced
 * through application-level validation, Zod schemas, backend RPC validation, or
 * database triggers.
 *
 * Stage 2.2 defines the frontend/domain type contract only. It does not
 * implement database triggers, RPC validation, or migration logic for
 * polymorphic integrity.
 */
export interface PolymorphicSource {
  sourceType: SourceType
  sourceId: EntityId
}

export type AttachmentEntityType =
  | 'daily_report'
  | 'inspection_report'
  | 'inspection_result'
  | 'ncr'
  | 'corrective_action'
  | 'project'
  | 'manual'

/**
 * Polymorphic attachment target.
 *
 * Attachments intentionally use `entityType`/`entityId` instead of storing
 * attachment ID arrays on business records. PostgreSQL cannot enforce a
 * traditional foreign key across multiple possible target tables for this
 * polymorphic reference. Later integrity must be enforced through application
 * validation, Zod schemas, backend RPC validation, or database triggers.
 *
 * Stage 2.2 does not implement those integrity mechanisms.
 */
export interface Attachment extends BaseEntity {
  entityType: AttachmentEntityType
  entityId: EntityId
  fileName: string
  fileUrl: string
  fileType: string
  fileSize?: number
  uploadedBy: EntityId
  uploadedAt: ISODateTimeString
}
