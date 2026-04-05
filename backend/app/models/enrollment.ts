import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Class from '#models/class'
import User from '#models/user'
import BeltProgress from '#models/belt_progress'

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

  @hasMany(() => BeltProgress)
  declare beltProgress: HasMany<typeof BeltProgress>
}
