import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Class from '#models/class'
import User from '#models/user'

export default class Review extends BaseModel {
  static table = 'reviews'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare classId: string

  @column()
  declare studentId: string

  @column()
  declare rating: number

  @column()
  declare comment: string | null

  @column.date()
  declare sessionDate: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>

  @belongsTo(() => User, { foreignKey: 'studentId' })
  declare student: BelongsTo<typeof User>
}
