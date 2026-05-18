import type { BaseEntity, EntityId, ISODateTimeString } from './common'

export type AuditAction =
  | 'Create'
  | 'Update'
  | 'Submit'
  | 'Approve'
  | 'Return'
  | 'Reject'
  | 'Delete'
  | 'Restore'
  | 'Archive'
  | 'Export'
  | 'Login'
  | 'PermissionChange'

/**
 * Future audit trail entry for legal and business record integrity.
 *
 * Stage 2.2 only defines the type-level contract. It does not implement audit
 * logging logic, database triggers, RPCs, or migration behavior.
 */
export interface AuditLogEntry extends BaseEntity {
  entityType: string
  entityId: EntityId
  action: AuditAction
  changedBy: EntityId
  changedAt: ISODateTimeString
  changes?: Record<string, unknown>
  reason?: string
  ipAddress?: string
  userAgent?: string
}
