import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Class from '#models/class'

export default class ClassSchedule extends BaseModel {
  static table = 'class_schedules'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare classId: string

  @column()
  declare dayOfWeek: number

  @column()
  declare startTime: string

  @column()
  declare endTime: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>
}
