import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Enrollment from '#models/enrollment'
import User from '#models/user'

export default class BeltProgress extends BaseModel {
  static table = 'belt_progress'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare enrollmentId: string

  @column()
  declare beltName: string

  @column.dateTime()
  declare awardedAt: DateTime

  @column()
  declare awardedBy: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>

  @belongsTo(() => User, { foreignKey: 'awardedBy' })
  declare awarder: BelongsTo<typeof User>
}
