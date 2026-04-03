import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import encryption from '@adonisjs/core/services/encryption'
import Enrollment from '#models/enrollment'
import User from '#models/user'

export default class Feedback extends BaseModel {
  static table = 'feedback'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare enrollmentId: string

  @column()
  declare teacherId: string

  @column({
    prepare: (value: string) => encryption.encrypt(value),
    consume: (value: string) => encryption.decrypt(value) as string,
  })
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Enrollment)
  declare enrollment: BelongsTo<typeof Enrollment>

  @belongsTo(() => User, { foreignKey: 'teacherId' })
  declare teacher: BelongsTo<typeof User>
}
