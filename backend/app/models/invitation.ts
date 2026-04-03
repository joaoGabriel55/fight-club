import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Class from '#models/class'

export default class Invitation extends BaseModel {
  static table = 'invitations'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare classId: string

  @column()
  declare token: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column()
  declare isActive: boolean

  @column()
  declare maxUses: number | null

  @column()
  declare useCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => Class)
  declare class: BelongsTo<typeof Class>
}
