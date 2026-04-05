import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'

export default class SessionNotification extends BaseModel {
  static table = 'session_notifications'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare enrollmentId: string

  @column.date()
  declare sessionDate: DateTime

  @column()
  declare notificationType: 'class_starting_soon' | 'class_session_ended'

  @column.dateTime()
  declare sentAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>
}
