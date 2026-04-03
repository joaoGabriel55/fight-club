import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Class from '#models/class'
import User from '#models/user'

export default class Enrollment extends BaseModel {
  static table = 'enrollments'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare classId: string

  @column()
  declare studentId: string

  @column()
  declare status: 'active' | 'left'

  @column.dateTime()
  declare joinedAt: DateTime

  @column.dateTime()
  declare leftAt: DateTime | null

  @column.dateTime()
  declare dataConsentAt: DateTime

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>

  @belongsTo(() => User, { foreignKey: 'studentId' })
  declare student: BelongsTo<typeof User>
}
