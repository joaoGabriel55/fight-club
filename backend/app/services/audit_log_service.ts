import AuditLog from '#models/audit_log'

export interface AuditLogOptions {
  resourceId?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}

export class AuditLogService {
  static async log(
    userId: string,
    action: string,
    resourceType: string,
    options: AuditLogOptions = {}
  ): Promise<void> {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId: options.resourceId ?? null,
      ipAddress: options.ipAddress ?? null,
      metadata: options.metadata ?? null,
    })
  }
}
