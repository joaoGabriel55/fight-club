import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import User from '#models/user'

export default class StudentProfile extends BaseModel {
  static table = 'student_profiles'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @column()
  declare weightKg: string | null

  @column()
  declare heightCm: string | null

  @column.dateTime()
  declare dataConsentAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
