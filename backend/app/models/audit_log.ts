import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class AuditLog extends BaseModel {
  static table = 'audit_logs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare action: string

  @column()
  declare resourceType: string

  @column()
  declare resourceId: string | null

  @column()
  declare ipAddress: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
